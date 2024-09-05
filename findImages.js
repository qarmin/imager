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
	let notAddedImageUrls = [];

	// Looks that some pages uses images as links, without proper extension
	let imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
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
	for (let all_info of imageUrls) {
		let image_src = all_info.src;
		let width = all_info.width;
		let height = all_info.height;

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
		img.alt = image_src;
		img.style.objectFit = "contain";
		img.style.width = "100%";
		aItem.appendChild(img);

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
		} else {
			setNoImagesFoundText();
		}
	}

	window.scrollTo(0, 0);
} catch (e) {
	console.error(e);
}
imageUrls;
