let settingsList = [
	["followAElements", true],
	["ignoreNonImageLinks", true],
	["loadImagesLazy", false],
	["rowsNumber", 6],
	["minimumImageSize", 100],
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

function processItems(showMode) {
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
					injectCode(tab.id, showMode, res["settings"], fileName);
				}
			});
		})
		.catch((error) => {
			console.error(error);
		});
}

function getSettingsVar(settings, showMode) {
	return `
    let showMode = "${showMode}";
    let followAElements = ${settings["followAElements"]};
    let ignoreNonImageLinks = ${settings["ignoreNonImageLinks"]};
    let loadImagesLazy = ${settings["loadImagesLazy"]};
    let rowsNumber = ${settings["rowsNumber"]};
    let minimumImageSize = ${settings["minimumImageSize"]};
    let ignoredElements = "${settings["ignoredElements"]}";
    let ignoredElementsLinksMode = "${settings["ignoredElementsLinksMode"]}";
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
		processItems(info.menuItemId);
	} else {
		console.error("Unknown menu item", info.menuItemId);
	}
});
