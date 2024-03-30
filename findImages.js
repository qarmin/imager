var imageUrls = [];
var onlyImageUrls = [];
try {
	// showMode - "biggestMode", "galleryMode"
	// followAElements - true, false
	// ignoreNonImageLinks - true, false
	// rowsNumber - 1-infinity
	// minimumImageSize - 1-infinity
	// ignoredElements - "avatar,logo,icon"

	var links = document.querySelectorAll("a");
	var images = document.querySelectorAll("img");
	var notAddedImageUrls = [];

	// Looks that some pages uses images as links, without proper extension
	var imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
	var dissalowedExtensions = [".mp4"];

	function addImage(url, width, height) {
		if (
			url == "" ||
			notAddedImageUrls.includes(url) ||
			onlyImageUrls.includes(url) ||
			dissalowedExtensions.some((ext) => url.endsWith(ext))
		) {
			return false;
		}
		if (ignoreNonImageLinks && !imageExtensions.some((ext) => url.includes(ext))) {
			return false;
		}
		if (width < minimumImageSize || height < minimumImageSize) {
			return false;
		}

		if (ignoredElements) {
			for (let el of ignoredElements.split(",")) {
				if (el.length != 0 && url.includes(el)) {
					return false;
				}
			}
		}

		imageUrls.push({ src: url, width: width, height: height });
		onlyImageUrls.push(url);
		return true;
	}

	if (followAElements) {
		for (var link of links) {
			var image = link.querySelector("img");
			if (image) {
				var im_height = image.naturalHeight || image.height;
				var im_width = image.naturalWidth || image.width;
				var added = false;
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

	document.body.innerHTML = "";
	document.body.style.backgroundColor = "#252525";
	document.body.style.height = "100vh";
	document.body.style.overflow = "auto";

	var all = [];
	var scripts = document.getElementsByTagName("script");
	for (const script of scripts) {
		all.push(script);
	}
	var metas = document.getElementsByTagName("meta");
	for (const meta of metas) {
		all.push(meta);
	}
	var links = document.getElementsByTagName("link");
	for (const link of links) {
		all.push(link);
	}

	for (var i = all.length; i >= 0; i--) {
		if (all[i] && all[i].parentNode) {
			all[i].parentNode.removeChild(all[i]);
		}
	}

	if (showMode === "biggestMode" && imageUrls.length > 0) {
		imageUrls.sort((a, b) => {
			return b.width * b.height - a.width * a.height;
		});
		imageUrls = [imageUrls[0]];
	}

	let items = [];
	let itemsHeight = [];
	for (var i = 0; i < rowsNumber; i++) {
		itemsHeight.push(0);
		items.push([]);
	}

	let setImageInBiggestMode = false;
	for (var all_info of imageUrls) {
		var image_src = all_info.src;
		var width = all_info.width;
		var height = all_info.height;

		var aItem = document.createElement("a");
		var img = document.createElement("img");
		//		console.error(img.width, img.height, width, height, img.naturalWidth, img.naturalHeight, image_src);
		aItem.href = image_src;
		aItem.width = 100 / rowsNumber + "%";

		img.src = image_src;
		img.style.objectFit = "contain";
		img.style.width = "100%";
		aItem.appendChild(img);

		if (showMode !== "biggestMode") {
			// Find in itemsHeight the lowest index
			var lowestIndex = 0;
			var lowestValue = itemsHeight[0];
			for (var i = 1; i < itemsHeight.length; i++) {
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
		var text = document.createElement("h1");
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
			var flexContainer = document.createElement("div");
			flexContainer.style.display = "flex";
			for (var i = 0; i < items.length; i++) {
				var column = document.createElement("div");
				column.style.display = "flex";
				column.style.flexDirection = "column";
				column.style.justifyContent = "flex-start";
				column.style.flex = 1;
				for (var item of items[i]) {
					item.style.margin = "5px";
					column.appendChild(item);
				}
				flexContainer.appendChild(column);
			}
			document.body.appendChild(flexContainer);
		} else {
			setNoImagesFoundText();
		}
	}

	window.scrollTo(0, 0);
} catch (e) {
	console.error(e);
}
imageUrls;
