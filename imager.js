let settingsList = [
    ["followAElements", true],
    ["ignoreNonImageLinks", true],
    ["rowsNumber", 6],
    ["minimumImageSize", 100],
    ["ignoredElements", "avatar,logo."]
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

function processImages(showMode) {
	browser.tabs
		.query({ highlighted: true })
		.then((tabs) => {
			browser.storage.local.get("settings").then((res) => {
				for (let tab of tabs) {
					findImagesOnTab(tab.id, showMode, res["settings"]);
				}
			});
		})
		.catch((error) => {
			console.error(error);
		});
}

function findImagesOnTab(tabId, showMode, settings) {
	multilineCode = `
    var showMode = "${showMode}";
    var followAElements = ${settings["followAElements"]};
    var ignoreNonImageLinks = ${settings["ignoreNonImageLinks"]};
    var rowsNumber = ${settings["rowsNumber"]};
    var minimumImageSize = ${settings["minimumImageSize"]};
    var ignoredElements = "${settings["ignoredElements"]}";
    `;

	browser.tabs
		.executeScript(tabId, {
			code: multilineCode,
		})
		.then(() => {
			// Then inject the findImages.js script
			return browser.tabs.executeScript(tabId, {
				file: "/findImages.js",
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

browser.menus.onClicked.addListener((info, tab) => {
	if (["biggestMode", "galleryMode"].includes(info.menuItemId)) {
		processImages(info.menuItemId);
	}
});
