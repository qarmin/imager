console.log("Starting initialization of extension");

function processImages(showMode) {
    browser.tabs.query({highlighted: true}).then((tabs) => {
      browser.storage.local.get('settings').then((res) => {
          for (let tab of tabs) {
            findImagesOnTab(tab.id, showMode, res["settings"]);
          }
      });
    }).catch((error) => {
      console.log(error);
    });
}

function findImagesOnTab(tabId, showMode, settings) {
    multilineCode = `
    var showMode = "${showMode}";
    var followAElements = ${settings["followAElements"]};
    var ignoreNonImageLinks = ${settings["ignoreNonImageLinks"]};
    `;
    console.error(multilineCode)

    browser.tabs.executeScript(tabId, {
        code: multilineCode
    }).then(() => {
        // Then inject the findImages.js script
        return browser.tabs.executeScript(tabId, {
            file: "/findImages.js"
        });
    }).then((results) => {
        console.log("Script findImages.js injected and returned", results);
    }).catch((error) => {
        console.error("Error injecting script", error);
    });
}

browser.menus.create({
  id: "galleryMode",
  title: "Gallery mode",
  contexts: ["page"]
});
browser.menus.create({
  id: "biggestMode",
  title: "Only bigges",
  contexts: ["page"]
});

console.log('Adding listener for context menu item click');
browser.menus.onClicked.addListener((info, tab) => {
    console.log('Context menu item clicked', info, tab);
    if (["biggestMode", "galleryMode"].includes(info.menuItemId)) {
        console.log('Context menu item clicked');
        processImages(info.menuItemId);
      }
});
console.log("Everything initialized!");