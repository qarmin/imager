document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('#followAElements').addEventListener('change', saveOptions);
document.querySelector('#ignoreNonImageLinks').addEventListener('change', saveOptions);

function saveOptions(e) {
  let key = e.target.id;
  browser.storage.local.get('settings').then((res) => {
    modifiedSettings = res["settings"];
    modifiedSettings[key] = e.target.checked;
    browser.storage.local.set({
      settings: modifiedSettings
    });
  })
}

// Set default settings
browser.storage.local.get('settings').then((res) => {
    newSettings = res["settings"];
    if (newSettings === undefined) {
        newSettings = {
            followAElements: true,
            ignoreNonImageLinks: true
        };
        browser.storage.local.set({
            settings: newSettings
        });
    } else {
        if (newSettings["followAElements"] === undefined) {
            newSettings["followAElements"] = true;
        }
        if (newSettings["ignoreNonImageLinks"] === undefined) {
            newSettings["ignoreNonImageLinks"] = true;
        }
    }
    browser.storage.local.set({
        settings: newSettings
    });
});

function restoreOptions() {
    browser.storage.local.get('settings').then((res) => {
        document.querySelector('#followAElements').checked = res["settings"]["followAElements"];
        document.querySelector('#ignoreNonImageLinks').checked = res["settings"]["ignoreNonImageLinks"];
    });
}