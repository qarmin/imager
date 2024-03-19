console.log("Starting initialization of extension");

function processImages(showMode) {
    browser.tabs.query({highlighted: true}).then((tabs) => {
      for (let tab of tabs) {
        findImagesOnTab(tab.id, showMode);
      }
    }).catch((error) => {
      console.log(error);
    });
}

function findImagesOnTab(tabId, showMode) {
    browser.tabs.executeScript(tabId, {
        code: `var showMode = "${showMode}";`
    }).then(() => {
        // Then inject the findImages.js script
        return browser.tabs.executeScript(tabId, {
            file: "/findImages.js"
        });
    }).then(() => {
        console.log("Script findImages.js injected");
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