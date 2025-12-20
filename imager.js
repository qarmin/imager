let settingsList = [
	["followAElements", true],
	["preserveSrcAndHref", false],
	["ignoreNonImageLinks", true],
	["loadImagesLazy", false],
	["usingCustomImageGathering", true],
	["rowsNumber", 6],
	["minimumImageSize", 100],
	["ignoreImageSize", false],
	["delayBetweenImages", 0],
	["ignoredElements", "avatar,logo."],
	["ignoredElementsLinksMode", "avatar,logo."],
	["autoFilterEnabled", false],
	["autoFilterDomains", ""],
];

// Set default settings
browser.storage.local.get("settings").then((res) => {
	newSettings = res["settings"] || {};
	for (let [setting, defaultValue] of settingsList) {
		if (newSettings[setting] === undefined) {
			newSettings[setting] = defaultValue;
		}
	}
	browser.storage.local.set({
		settings: newSettings,
	});
});

function processItems(showMode, windowId) {
	let fileName;
	if (["biggestMode", "galleryMode"].includes(showMode)) {
		fileName = "./findImages.js";
	} else if (["collectLinksMode"].includes(showMode)) {
		fileName = "./findLinks.js";
	} else {
		console.error("Unknown showMode", showMode);
		return;
	}

	browser.tabs
		.query({ highlighted: true })
		.then((tabs) => {
			browser.storage.local.get("settings").then((res) => {
				for (let tab of tabs) {
					if (windowId === tab.windowId) {
						injectCode(tab.id, showMode, res["settings"], fileName);
					}
				}
			});
		})
		.catch((error) => {
			console.error(error);
		});
}

function getSettingsVar(settings, showMode) {
	return `
    var showMode = "${showMode}";
    var followAElements = ${settings["followAElements"]};
    var preserveSrcAndHref = ${settings["preserveSrcAndHref"]};
    var ignoreNonImageLinks = ${settings["ignoreNonImageLinks"]};
    var loadImagesLazy = ${settings["loadImagesLazy"]};
    var usingCustomImageGathering = ${settings["usingCustomImageGathering"]};
    var rowsNumber = ${settings["rowsNumber"]};
    var minimumImageSize = ${settings["minimumImageSize"]};
    var ignoredElements = "${settings["ignoredElements"]}";
    var ignoredElementsLinksMode = "${settings["ignoredElementsLinksMode"]}";
    var delayBetweenImages = "${settings["delayBetweenImages"]}";
    var ignoreImageSize = ${settings["ignoreImageSize"]};
    `;
}

function injectCode(tabId, showMode, settings, fileName) {
	multilineCode = getSettingsVar(settings, showMode);

	browser.tabs
		.executeScript(tabId, {
			code: multilineCode,
		})
		.then(() => {
			// Then inject the findImages.js script
			return browser.tabs.executeScript(tabId, {
				file: fileName,
			});
		})
		.then((results) => {
			//console.log("Script findImages.js injected and returned", results);
		})
		.catch((error) => {
			console.error("Error injecting script", error);
		});
}

browser.menus.create({
	id: "galleryMode",
	title: "Gallery mode",
	contexts: ["page"],
});
browser.menus.create({
	id: "biggestMode",
	title: "Show biggest",
	contexts: ["page"],
});
browser.menus.create({
	id: "collectLinksMode",
	title: "Collect links",
	contexts: ["page"],
});

browser.menus.create({
	type: "separator",
	contexts: ["page"],
});

browser.menus.create({
	id: "applyImageFiltering",
	title: "Apply Filtering",
	contexts: ["page"],
});

browser.menus.create({
	id: "collectFilterImages",
	title: "Collect Filters",
	contexts: ["page"],
});

browser.menus.onClicked.addListener((info, tab) => {
	if (["biggestMode", "galleryMode", "collectLinksMode"].includes(info.menuItemId)) {
		processItems(info.menuItemId, tab.windowId);
	} else if (info.menuItemId === "applyImageFiltering") {
		applyImageFiltering(tab);
	} else if (info.menuItemId === "collectFilterImages") {
		collectFilterImages(tab);
	} else {
		console.error("Unknown menu item", info.menuItemId);
	}
});

// SeenThis Image Filtering Functions
function applyImageFiltering(tab) {
	console.log("[SeenThis] Applying image filtering to tab:", tab.id);

	browser.tabs
		.executeScript(tab.id, {
			code: "var collectAndFilter = false;",
		})
		.then(() => {
			return browser.tabs.executeScript(tab.id, {
				file: "./filterImages.js",
			});
		})
		.then(() => {
			console.log("[SeenThis] Image filtering applied");
		})
		.catch((error) => {
			console.error("[SeenThis] Error applying image filtering:", error);
		});
}

function collectFilterImages(tab) {
	console.log("[SeenThis] Collecting images on tab:", tab.id);

	browser.tabs
		.executeScript(tab.id, {
			file: "./collectImages.js",
		})
		.then(() => {
			console.log("[SeenThis] Image collection initiated");
		})
		.catch((error) => {
			console.error("[SeenThis] Error collecting images:", error);
		});
}

// Listen for messages from content scripts
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "saveCollectedImages") {
		console.log("[SeenThis] Received", request.urls.length, "collected image URLs");

		// Send message to popup to update the filter list
		browser.runtime
			.sendMessage({
				action: "imagesCollected",
				urls: request.urls,
				pageUrl: request.pageUrl,
			})
			.catch((error) => {
				// Popup might not be open, that's OK
				console.log("[SeenThis] Popup not open, saving to storage directly");

				// Save directly to storage if popup is not open
				browser.storage.local.get(["seenThisFilters"]).then((result) => {
					const currentFilters = result.seenThisFilters || "";
					const date = new Date();
					const dateStr = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

					let newEntry = `// ${dateStr} - ${request.pageUrl}\n`;
					newEntry += request.urls.join("\n");
					newEntry += "\n\n";

					const updatedFilters = newEntry + currentFilters;
					browser.storage.local.set({ seenThisFilters: updatedFilters });
					console.log("[SeenThis] Saved directly to storage");
				});
			});
	}
});

// Auto-filter on page load
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	// Only run when page has finished loading
	if (changeInfo.status === "complete" && tab.url) {
		browser.storage.local.get("settings").then((res) => {
			const settings = res.settings || {};

			// Check if auto-filtering is enabled
			if (!settings.autoFilterEnabled) {
				return;
			}

			// Get the domain from the URL
			try {
				const url = new URL(tab.url);
				const domain = url.hostname;

				// Parse the domains list
				const autoFilterDomains = (settings.autoFilterDomains || "")
					.split("\n")
					.map((d) => d.trim())
					.filter((d) => d);

				// Check if current domain matches any in the list
				const shouldFilter = autoFilterDomains.some((filterDomain) => {
					return domain === filterDomain || domain.endsWith("." + filterDomain);
				});

				if (shouldFilter) {
					console.log("[SeenThis] Auto-filtering enabled for domain:", domain);
					// Apply filtering to this tab
					browser.tabs
						.executeScript(tabId, {
							file: "./filterImages.js",
						})
						.then(() => {
							console.log("[SeenThis] Auto-filtering applied to tab:", tabId);
						})
						.catch((error) => {
							console.error("[SeenThis] Error auto-filtering:", error);
						});
				}
			} catch (error) {
				console.error("[SeenThis] Error parsing URL for auto-filter:", error);
			}
		});
	}
});
