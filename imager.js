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

browser.menus.onClicked.addListener((info, tab) => {
	if (["biggestMode", "galleryMode", "collectLinksMode"].includes(info.menuItemId)) {
		processItems(info.menuItemId, tab.windowId);
	} else {
		console.error("Unknown menu item", info.menuItemId);
	}
});
