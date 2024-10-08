// extension -> list of links
let collectedLinks = {};
const WITHOUT_EXTENSION = "Without extension";
const ITEMS_TO_REMOVE_FROM_START = ["https://", "http://", "www."];
try {
	let fullCurrentUrl = window.location.href;
	let currentUrlIsHttps = fullCurrentUrl.startsWith("https://");
	let currentUrl = fullCurrentUrl.replace("http://", "").replace("https://", "").replace("www.", "");

	let validatedElementsToIgnore = ignoredElementsLinksMode
		.split(",")
		.map((el) => el.trim())
		.filter((el) => el.length !== 0);

	function deduplicateArray(arr) {
		return [...new Set(arr)];
	}
	function loadFromLinks() {
		let allLinks = [];
		let links = Array.from(document.querySelectorAll("a, img, video, source"));
		for (let link of links) {
			let href = link.href || link.src || link.currentSrc;
			if (href) {
				if (!href.startsWith("http")) {
					allLinks.push(fullCurrentUrl + href);
				} else {
					allLinks.push(href);
				}
			}
		}
		allLinks = deduplicateArray(allLinks);

		for (let link of allLinks) {
			// Cleaned link with deleted everything after ? or #
			let cleanedRightLink = link.split("?")[0].split("#")[0];

			// Remove / at the end of the link
			if (cleanedRightLink.endsWith("/")) {
				cleanedRightLink = cleanedRightLink.slice(0, -1);
			}

			// Remove items from the start of the link
			let fullCleanerLink = cleanedRightLink;
			for (let item of ITEMS_TO_REMOVE_FROM_START) {
				if (fullCleanerLink.startsWith(item)) {
					fullCleanerLink = fullCleanerLink.slice(item.length);
				}
			}

			// Just site link, nothing more
			if (fullCleanerLink.split("/").length === 1) {
				if (collectedLinks[WITHOUT_EXTENSION] === undefined) {
					collectedLinks[WITHOUT_EXTENSION] = [];
				}
				collectedLinks[WITHOUT_EXTENSION].push(processCustomImageLink(cleanedRightLink));
				continue;
			}

			let lastPart = cleanedRightLink.split("/").pop();
			let extension;
			if (lastPart.includes(".")) {
				extension = lastPart.split(".").pop().toLowerCase();
			} else {
				extension = WITHOUT_EXTENSION;
			}
			if (collectedLinks[extension] === undefined) {
				collectedLinks[extension] = [];
			}
			// console.error(collectedLinks[extension]);
			collectedLinks[extension].push(processCustomImageLink(cleanedRightLink));
		}
	}

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

	function isAlphanumeric(char) {
		const code = char.charCodeAt(0);
		return (
			(code >= 48 && code <= 57) || // 0-9
			(code >= 65 && code <= 90) || // A-Z
			(code >= 97 && code <= 122) // a-z
		);
	}

	function loadFromDocumentBody() {
		try {
			let content = document.body.outerHTML;
			content = content
				.replace(/%3A/g, ":")
				.replace(/%2F/g, "/")
				.replace(/&amp/g, "&")
				.replace(/%3F/g, "?")
				.replace(/%3D/g, "=")
				.replace(/%2C/g, ",")
				// .replace(/https:\/\//g, "http://")
				.replace(/http:\/\/www\./g, "http://")
				.replace(/https:\/\/www\./g, "https://")
				.replace(/http:\/\//g, "\nhttp://")
				.replace(/https:\/\//g, "\nhttps://")
				.replace("#", "\n")
				.replace("&", "\n")
				.replace(" ", "\n");
			let splits = content.split("\n");
			let links = [];
			for (const split of splits) {
				if (!(split.startsWith("http://") || split.startsWith("https://"))) {
					continue;
				}

				let link = "";
				for (const char of split) {
					if (char === "?") {
						// link += char // TODO add as option
						break;
					} else if (["/", ".", ":", "_", "-", "=", "%", "$", "+", "!", "*"].includes(char)) {
						link += char;
					} else if (isAlphanumeric(char)) {
						link += char;
					} else {
						if ([">", '"', "<", "'", "@", "\\", "(", ")", "[", "]", ","].includes(char)) {
							// TODO
						}
						break;
					}
				}
				if (link.endsWith("/")) {
					link = link.slice(0, -1);
				}
				links.push(processCustomImageLink(link));
			}
			links.sort();
			links = deduplicateArray(links);

			for (const lnk of links) {
				let lastPart = lnk.split("/").pop();
				let extension;
				if (!lastPart.includes(".") || lnk.split("/").length === 1) {
					extension = WITHOUT_EXTENSION;
				} else {
					let extTemp = lastPart.split(".").pop().toLowerCase();
					if (extTemp === "") {
						extension = WITHOUT_EXTENSION;
					} else {
						extension = extTemp;
					}
				}

				if (collectedLinks[extension] === undefined) {
					collectedLinks[extension] = [];
				}
				collectedLinks[extension].push(lnk);
			}

			// console.error(collectedLinks);
		} catch (e) {
			console.error("ERROR - ", e);
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

	// Sometimes links are not in href/src
	loadFromLinks();
	loadFromDocumentBody();

	removeAllItems();
	document.body.style.backgroundColor = "#252525";
	document.body.style.color = "#ffffff";
	// change links color to whiter

	// Replace site content with

	let collectedLinksKeys = Object.keys(collectedLinks);
	collectedLinksKeys.sort();

	// Remove empty extension if exists and move at the end
	if (collectedLinksKeys.includes(WITHOUT_EXTENSION)) {
		collectedLinksKeys = collectedLinksKeys.filter((key) => key !== WITHOUT_EXTENSION);
		collectedLinksKeys.push(WITHOUT_EXTENSION);
	}

	const contentDiv = document.createElement("div");

	for (const key of collectedLinksKeys) {
		const h2 = document.createElement("h2");
		h2.textContent = key;
		contentDiv.appendChild(h2);

		let links = collectedLinks[key];
		links.sort();
		if (validatedElementsToIgnore.length !== 0) {
			links = links.filter((link) => {
				for (const el of validatedElementsToIgnore) {
					if (link.includes(el)) {
						return false;
					}
				}
				return true;
			});
		}
		links = deduplicateArray(links);

		for (const link of links) {
			const a = document.createElement("a");
			a.href = link;
			a.style.color = "#ffffff";
			a.textContent = link;
			contentDiv.appendChild(a);
			contentDiv.appendChild(document.createElement("br"));
		}
	}
	document.body.appendChild(contentDiv);

	window.scrollTo(0, 0);
} catch (e) {
	console.error("ALL ERRORS - ", e);
}
collectedLinks;
