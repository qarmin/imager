let imageUrls = [];
let onlyImageUrls = [];
try {
	// showMode - "biggestMode", "galleryMode"
	// followAElements - true, false
	// ignoreNonImageLinks - true, false
	// loadImagesLazy - true, false
	// rowsNumber - 1-infinity
	// minimumImageSize - 1-infinity
	// ignoredElements - "avatar,logo."
	// ignoredElementsLinksMode - "avatar,logo"
	// usingCustomImageGathering - true, false
	// delayBetweenImages - -infinity-infinity - lower than 0 means no delay
	// ignoreImageSize - true, false

	let links = document.querySelectorAll("a");
	let images = document.querySelectorAll("img");
	let sources = document.querySelectorAll("source");
	let notAddedImageUrls = [];

	// Looks that some pages uses images as links, without proper extension
	let imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
	let imageExtensionsWithoutDot = imageExtensions.map((ext) => ext.slice(1));
	let disallowedExtensions = [".mp4"];

	function processCustomImageLink(url) {
		if (!usingCustomImageGathering) {
			return url;
		}
		if (url.includes("wykop.pl")) {
			// find latest , and remove everything after it without extension
			// https://wykop.pl/cdn/7c4cda5db7d1493f05c7-4b44df189463bab1b45cced887282d0b/tag_background_rosja_7jWWpsfN20t4eWrGPsRY,w1260.jpg
			let lastCommaIndex = url.lastIndexOf(",");
			let lastDotIndex = url.lastIndexOf(".");
			if (lastDotIndex === -1) {
				return url;
			}
			let extension = url.slice(lastDotIndex);
			if (lastCommaIndex !== -1) {
				url = url.slice(0, lastCommaIndex) + extension;
			}
		}
		return url;
	}

	function deduplicateArray(arr) {
		return [...new Set(arr)];
	}

	function addImage(url, width, height) {
		let validatedUrl = processCustomImageLink(url);
		if (
			validatedUrl == "" ||
			notAddedImageUrls.includes(validatedUrl) ||
			onlyImageUrls.includes(validatedUrl) ||
			disallowedExtensions.some((ext) => validatedUrl.endsWith(ext))
		) {
			return false;
		}

		let urlLower = validatedUrl.toLowerCase();
		if (ignoreNonImageLinks && !imageExtensions.some((ext) => urlLower.includes(ext))) {
			return false;
		}

		if (!ignoreImageSize) {
			if (width < minimumImageSize || height < minimumImageSize) {
				return false;
			}
		}

		if (ignoredElements) {
			for (let el of ignoredElements.split(",")) {
				if (el.length !== 0 && validatedUrl.includes(el)) {
					return false;
				}
			}
		}
		imageUrls.push({ src: validatedUrl, width: width, height: height });
		onlyImageUrls.push(validatedUrl);
		return true;
	}

	if (followAElements) {
		for (let link of links) {
			let image = link.querySelector("img");
			if (image) {
				let im_height = image.naturalHeight || image.height;
				let im_width = image.naturalWidth || image.width;
				let added = false;
				added = addImage(link.href, im_width, im_height);
				if (!added) {
					addImage(image.src, im_width, im_height);
				} else {
					notAddedImageUrls.push(image.src);
				}
			}
		}
	}

	// Iterate over all images
	for (const im of images) {
		if (im.naturalWidth === 0 || im.naturalHeight === 0) {
			addImage(im.src, im.width, im.height);
		} else {
			addImage(im.src, im.naturalWidth, im.naturalHeight);
		}
	}
	for (const source of sources) {
		let type = source.type || "";
		if (!imageExtensionsWithoutDot.some((ext) => type.endsWith(ext))) {
			continue;
		}
		let url = source.srcset || source.src;
		let width = source.width || 0;
		let height = source.height || 0;

		// strip // at start
		if (url.startsWith("//")) {
			url = url.slice(2);
			url = "https://" + url;
		}

		addImage(url, width, height);
	}

	function removeAllItems() {
		document.body.innerHTML = "";
		document.body.style = null;

		let all = [];
		let scripts = document.getElementsByTagName("script");
		for (const script of scripts) {
			all.push(script);
		}
		let metas = document.getElementsByTagName("meta");
		for (const meta of metas) {
			all.push(meta);
		}
		let links = document.getElementsByTagName("link");
		for (const link of links) {
			all.push(link);
		}

		for (let i = all.length; i >= 0; i--) {
			if (all[i] && all[i].parentNode) {
				all[i].parentNode.removeChild(all[i]);
			}
		}
	}

	function addDelayBetweenImages() {
		if (delayBetweenImages > 0) {
			const script = document.createElement("script");
			script.textContent = `
    (function() {
      let index = 0;
      const images = document.querySelectorAll('img');

		console.error("Current images", index, images.length);
      function loadNextImage() {
      console.error("Current images", index, images.length);
        if (index >= images.length) {
          return;
        }

        const img = images[index];
        if (img && img.alt) {
          img.src = img.alt;
        }

        index++;
        setTimeout(loadNextImage, ${delayBetweenImages});
      }

      loadNextImage();
    })();
  `;
			document.body.appendChild(script);
		}
	}

	function addScriptToLoadHeightSize() {
		const script = document.createElement("script");
		script.textContent = `
    (function() {
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        img.onload = function() {
          const sizeInfo = img.nextElementSibling;
          if (sizeInfo && sizeInfo.id && sizeInfo.id.startsWith('sizeInfo-')) {
            sizeInfo.textContent = \`\${img.naturalWidth}x\${img.naturalHeight}\`;
          }
        };
      });
    })();
  `;
		document.body.appendChild(script);
	}

	removeAllItems();
	document.body.style.backgroundColor = "#252525";
	document.body.style.height = "100vh";
	document.body.style.overflow = "auto";

	if (showMode === "biggestMode" && imageUrls.length > 0) {
		imageUrls.sort((a, b) => {
			return b.width * b.height - a.width * a.height;
		});
		imageUrls = [imageUrls[0]];
	}

	let items = [];
	let itemsHeight = [];
	for (let i = 0; i < rowsNumber; i++) {
		itemsHeight.push(0);
		items.push([]);
	}

	let setImageInBiggestMode = false;
	let imageIdx = 0;
	for (let all_info of imageUrls) {
		let image_src = all_info.src;
		// Set width to 100 if is 0, to not put everything in one column
		// Not really optimal, but better than nothing
		let width = all_info.width || 100;
		let height = all_info.height || 100;

		let aItem = document.createElement("a");
		let img = document.createElement("img");
		//		console.error(img.width, img.height, width, height, img.naturalWidth, img.naturalHeight, image_src);
		aItem.href = image_src;
		aItem.width = 100 / rowsNumber + "%";

		if (delayBetweenImages <= 0) {
			img.src = image_src;
		}
		if (loadImagesLazy) {
			img.loading = "lazy";
		}
		// img.alt = image_src; // Using src, will sometimes break layout
		img.alt = "Missing";
		img.style.objectFit = "contain";
		img.style.width = "100%";
		aItem.appendChild(img);

		let sizeInfo = document.createElement("div");
		// sizeInfo.textContent = `${width}x${height}`;
		sizeInfo.id = "sizeInfo-" + imageIdx;
		imageIdx += 1;
		sizeInfo.style.position = "absolute";
		sizeInfo.style.bottom = "0";
		sizeInfo.style.left = "50%";
		sizeInfo.style.transform = "translateX(-50%)"; // Center the text horizontally
		sizeInfo.style.color = "white"; // Set text color to white
		// sizeInfo.style.textShadow = "1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white"; // Add white outline
		sizeInfo.style.textShadow = "1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black"; // Add black outline
		sizeInfo.style.padding = "2px 5px";
		sizeInfo.style.pointerEvents = "none"; // Ensure the div does not capture clicks

		aItem.style.position = "relative"; // Ensure the container is positioned
		aItem.appendChild(sizeInfo);

		if (showMode !== "biggestMode") {
			// Find in itemsHeight the lowest index
			let lowestIndex = 0;
			let lowestValue = itemsHeight[0];
			for (let i = 1; i < itemsHeight.length; i++) {
				if (itemsHeight[i] < lowestValue) {
					lowestValue = itemsHeight[i];
					lowestIndex = i;
				}
			}
			itemsHeight[lowestIndex] += height / width;
			items[lowestIndex].push(aItem);
		} else {
			setImageInBiggestMode = true;
			window.location.href = image_src;
		}
	}

	function setNoImagesFoundText() {
		let text = document.createElement("h1");
		text.style.color = "white";
		text.style.textAlign = "center";
		text.style.marginTop = "20%";
		text.innerText =
			"No images found to display.\nCheck settings to verify if you have correct settings.\nOr use it on different page.\n(" +
			links.length +
			" links, " +
			images.length +
			" images was checked)";
		document.body.appendChild(text);
	}

	if (showMode === "biggestMode" && !setImageInBiggestMode) {
		setNoImagesFoundText();
	}

	// Add items in columns - items[columnIndex] contains items
	if (showMode !== "biggestMode") {
		let calculateItemsNumber = items.reduce((acc, val) => acc + val.length, 0);
		if (calculateItemsNumber > 0) {
			let flexContainer = document.createElement("div");
			flexContainer.style.display = "flex";
			for (let i = 0; i < items.length; i++) {
				let column = document.createElement("div");
				column.style.display = "flex";
				column.style.flexDirection = "column";
				column.style.justifyContent = "flex-start";
				column.style.flex = 1;
				for (let item of items[i]) {
					item.style.margin = "5px";
					column.appendChild(item);
				}
				flexContainer.appendChild(column);
			}
			document.body.appendChild(flexContainer);

			addScriptToLoadHeightSize();
			addDelayBetweenImages();
		} else {
			setNoImagesFoundText();
		}
	}

	window.scrollTo(0, 0);
} catch (e) {
	console.error(e);
}
imageUrls;
