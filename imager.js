// Set default settings
browser.storage.local.get("settings").then((res) => {
	newSettings = res["settings"];
	if (newSettings === undefined) {
		newSettings = {
			followAElements: true,
			ignoreNonImageLinks: true,
			rowsNumber: 6,
		};
		browser.storage.local.set({
			settings: newSettings,
		});
	} else {
		if (newSettings["followAElements"] === undefined) {
			newSettings["followAElements"] = true;
		}
		if (newSettings["ignoreNonImageLinks"] === undefined) {
			newSettings["ignoreNonImageLinks"] = true;
		}
		if (newSettings["rowsNumber"] === undefined) {
			newSettings["rowsNumber"] = 6;
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
	title: "Only bigges",
	contexts: ["page"],
});

browser.menus.onClicked.addListener((info, tab) => {
	if (["biggestMode", "galleryMode"].includes(info.menuItemId)) {
		processImages(info.menuItemId);
	}
});
