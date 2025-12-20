// SeenThis Image Filtering
// This script filters images on the page based on stored filter lists

try {
	console.log("[SeenThis] Starting image filtering...");

	// Get filter lists from storage
	browser.storage.local.get(["seenThisFilters", "seenThisExclusions"]).then((result) => {
		const filters = result.seenThisFilters || "";
		const exclusions = result.seenThisExclusions || "";

		console.log("[SeenThis] Loaded filters and exclusions");

		// Parse filter list - extract URLs (ignore comments starting with //)
		const filterUrls = filters
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("//"))
			.filter((line) => line.match(/^https?:\/\//));

		// Parse exclusion list
		const exclusionUrls = exclusions
			.split("\n")
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("//"))
			.filter((line) => line.match(/^https?:\/\//));

		console.log("[SeenThis] Filter URLs count:", filterUrls.length);
		console.log("[SeenThis] Exclusion URLs count:", exclusionUrls.length);

		if (filterUrls.length === 0) {
			console.log("[SeenThis] No filters to apply");
			return;
		}

		// Create a replacement image (red and black diagonal stripes)
		const canvas = document.createElement("canvas");
		canvas.width = 400;
		canvas.height = 400;
		const ctx = canvas.getContext("2d");

		// Draw diagonal stripes
		const stripeWidth = 40;
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#ff0000";

		for (let i = -canvas.height; i < canvas.width + canvas.height; i += stripeWidth * 2) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i + canvas.height, canvas.height);
			ctx.lineTo(i + canvas.height + stripeWidth, canvas.height);
			ctx.lineTo(i + stripeWidth, 0);
			ctx.closePath();
			ctx.fill();
		}

		const replacementDataUrl = canvas.toDataURL();

		// Track filtered images to avoid double-processing
		const filteredImages = new WeakSet();

		// Function to filter a single image
		function filterImage(img) {
			// Skip if already filtered
			if (filteredImages.has(img)) {
				return false;
			}

			const src = img.src || img.getAttribute("data-src") || img.getAttribute("srcset") || "";

			// Skip if no src
			if (!src) {
				return false;
			}

			// Skip if it's already our replacement image
			if (src === replacementDataUrl || src.startsWith("data:image/png;base64")) {
				return false;
			}

			// Check if image is in exclusion list
			if (exclusionUrls.some((url) => src.includes(url) || url.includes(src))) {
				console.log("[SeenThis] Image in exclusion list, skipping:", src);
				return false;
			}

			// Check if image matches any filter
			const matchesFilter = filterUrls.some((filterUrl) => {
				// Normalize URLs for comparison
				const normalizedSrc = src.split("?")[0].toLowerCase();
				const normalizedFilter = filterUrl.split("?")[0].toLowerCase();
				return (
					normalizedSrc === normalizedFilter ||
					normalizedSrc.includes(normalizedFilter) ||
					normalizedFilter.includes(normalizedSrc)
				);
			});

			if (matchesFilter) {
				console.log("[SeenThis] Filtering image:", src);

				// Mark as filtered BEFORE modifying
				filteredImages.add(img);

				// Modify the image
				img.src = replacementDataUrl;
				if (img.hasAttribute("srcset")) {
					img.removeAttribute("srcset");
				}

				return true;
			}

			return false;
		}

		// Filter all existing images on the page
		let filteredCount = 0;
		const images = document.querySelectorAll("img");
		images.forEach((img) => {
			if (filterImage(img)) {
				filteredCount++;
			}
		});

		console.log("[SeenThis] Filtered", filteredCount, "initial images");

		// Set up MutationObserver to catch dynamically loaded images
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				// Check added nodes
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						// Check if the node itself is an image
						if (node.tagName === "IMG") {
							if (filterImage(node)) {
								console.log("[SeenThis] Filtered dynamically added image");
							}
						}
						// Check for images within the added node
						const imgs = node.querySelectorAll ? node.querySelectorAll("img") : [];
						imgs.forEach((img) => {
							if (filterImage(img)) {
								console.log("[SeenThis] Filtered image in dynamically added content");
							}
						});
					}
				});

				// Check for attribute changes (lazy loading changes data-src to src)
				if (mutation.type === "attributes" && mutation.target.tagName === "IMG") {
					if (
						mutation.attributeName === "src" ||
						mutation.attributeName === "srcset" ||
						mutation.attributeName === "data-src"
					) {
						if (filterImage(mutation.target)) {
							console.log("[SeenThis] Filtered lazy-loaded image");
						}
					}
				}
			});
		});

		// Start observing the document for changes
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["src", "srcset", "data-src"],
		});

		console.log("[SeenThis] MutationObserver active - monitoring for new images");
	});
} catch (error) {
	console.error("[SeenThis] Error:", error);
}
