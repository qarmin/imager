console.log("Starting initialization of extension");

browser.runtime.onMessage.addListener((message) => {
  for (let url of message.imageUrls) {
    console.log(url);
  }
  browser.tabs.executeScript(tabId, {
      file: "/showImagesInGrid.js"
  }).then(() => {
      console.log("Script showImagesInGrid.js injected");
  }).catch((error) => {
      console.error("Error injecting script", error);
  });
});

function processImages() {
    browser.tabs.query({highlighted: true}).then((tabs) => {
      for (let tab of tabs) {
        findImagesOnTab(tab.id);
      }
    }).catch((error) => {
      console.log(error);
    });
}

function findImagesOnTab(tabId) {
    browser.tabs.executeScript(tabId, {
        file: "/findImages.js"
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

console.log('Adding listener for context menu item click');
browser.menus.onClicked.addListener((info, tab) => {
    console.log('Context menu item clicked', info, tab);
  if (info.menuItemId === "galleryMode") {
    console.log('Context menu item clicked');
    processImages();
  }
});
console.log("Everything initialized!");