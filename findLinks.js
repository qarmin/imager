// extension -> list of links
var collectedLinks = {};
const WITHOUT_EXTENSION = "WITHOUT_EXTENSION";
const ITEMS_TO_REMOVE_FROM_START =  ["https://", "http://", "www."];
try {
	function deduplicateArray(arr) {
		return [...new Set(arr)];
	}
	function loadFromLinks() {
		let allLinks = [];
		let links = Array.from(document.querySelectorAll("a, img, video, source"));
		let currentUrl = window.location.href;
		for (let link of links) {
			let href = link.href || link.src || link.currentSrc;
			if (href) {
				// TODO check if link is relative or absolute
				allLinks.push(href);
			}
		}
		allLinks = deduplicateArray(allLinks);

		for (let link of allLinks) {
			// Cleaned link with deleted everything after ? or #
			let cleanedLink = link.split("?")[0].split("#")[0];

			// Remove items from the start of the link
			for (let item of ITEMS_TO_REMOVE_FROM_START) {
				if (cleanedLink.startsWith(item)) {
					cleanedLink = cleanedLink.slice(item.length);
				}
			}

			// Remove / at the end of the link
			if (cleanedLink.endsWith("/")) {
				cleanedLink = cleanedLink.slice(0, -1);
			}

			// Just site link, nothing more
			if (cleanedLink.split("/").length === 1) {
				if (collectedLinks[WITHOUT_EXTENSION] === undefined) {
					collectedLinks[WITHOUT_EXTENSION] = [];
				}
				collectedLinks[WITHOUT_EXTENSION].push(cleanedLink);
				continue;
			}

			let lastPart = cleanedLink.split("/").pop();
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
			collectedLinks[extension].push(cleanedLink);
		}
	}
	function isAlphanumeric(char) {
		const code = char.charCodeAt(0);
		return (code >= 48 && code <= 57) || // 0-9
			(code >= 65 && code <= 90) || // A-Z
			(code >= 97 && code <= 122);  // a-z
	}

	function loadFromDocumentBody() {
		try {
			let content = document.body.outerHTML;
			content = content.replace(/%3A/g, ":")
				.replace(/%2F/g, "/")
				.replace(/&amp/g, "&")
				.replace(/%3F/g, "?")
				.replace(/%3D/g, "=")
				.replace(/%2C/g, ",")
				.replace(/https:\/\//g, "http://")
				.replace(/http:\/\/www\./g, "http://")
				.replace(/http:\/\//g, "\nhttp://")
				.replace("#", "\n")
				.replace("&", "\n")
				.replace(" ", "\n")
			let splits = content.split("\n");
			let links = []
			for (const split of splits) {
				if (!split.startsWith("http://")) {
					continue;
				}
				let link = "";
				for (const char of split) {
					if (char === "?") {
						// link += char // TODO add as option
						break;
					} else if (['/', '.', ':', '_', '-', '=', '[', ']', '%', '$', '+'
						, '!', '*'].includes(char)) {
						link += char;
					} else if (isAlphanumeric(char)) {
						link += char;
					} else {
						if (['>', '"', '<', '\'', '@', '\\'].includes(char)) {
							// TODO
						}
						break;
					}
				}
				if (link.endsWith("/")) {
					link = link.slice(0, -1);
				}
				links.push(link);
			}
			links = deduplicateArray(links);
			links.sort();

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

			console.error(collectedLinks);

		} catch (e) {
			console.error("ERROR - ", e);
		}
	}

	function removeAllItems() {
		document.body.innerHTML = "";

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
	}


	// loadFromLinks()
	loadFromDocumentBody()

	removeAllItems();
	document.body.style.backgroundColor = "#252525";
	document.body.style.color = "#ffffff";
	// change links color to whiter

	// Replace site content with

	let newHtml = "";
	let collectedLinksKeys = Object.keys(collectedLinks);
	collectedLinksKeys.sort();

	// Remove empty extension if exists and move at the end
	if (collectedLinksKeys.includes(WITHOUT_EXTENSION)) {
		collectedLinksKeys = collectedLinksKeys.filter((key) => key !== WITHOUT_EXTENSION);
		collectedLinksKeys.push(WITHOUT_EXTENSION);
	}

	for (const key in collectedLinksKeys) {
		newHtml += `<h2>${key}</h2>`;
		for (const link of collectedLinks[key]) {
			newHtml += `<a href="${link}" style="color: #ffffff;">${link}</a><br>`;
		}
	}

	document.body.innerHTML = newHtml;


	// console.error(allLinks);
	// console.error(currentUrl)
	// console.error(collectedLinks);

	window.scrollTo(0, 0);
} catch (e) {
	console.error("ALL ERRORS - ", e);
}
collectedLinks;
