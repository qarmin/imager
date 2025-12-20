// SeenThis Image Collection
// This script collects images from the page and saves them to filters

try {
	console.log("[SeenThis] Collecting images from page...");

	const images = document.querySelectorAll("img");
	const imageUrls = [];
	const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];

	images.forEach((img) => {
		let url = img.src || img.getAttribute("data-src") || "";

		// Validate URL
		if (!url || !url.match(/^https?:\/\//)) {
			return;
		}

		// Check if it has a valid image extension
		const hasValidExtension = imageExtensions.some((ext) => url.toLowerCase().includes(ext));

		if (hasValidExtension && !imageUrls.includes(url)) {
			imageUrls.push(url);
		}
	});

	console.log("[SeenThis] Collected", imageUrls.length, "image URLs");

	if (imageUrls.length > 0) {
		// Send collected URLs back to background script
		browser.runtime.sendMessage({
			action: "saveCollectedImages",
			urls: imageUrls,
			pageUrl: window.location.hostname,
		});
	} else {
		console.log("[SeenThis] No images found on page");
	}
} catch (error) {
	console.error("[SeenThis] Error:", error);
}
