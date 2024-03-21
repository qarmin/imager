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

function restoreOptions() {
    browser.storage.local.get('settings').then((res) => {
        document.querySelector('#followAElements').checked = res["settings"]["followAElements"];
        document.querySelector('#ignoreNonImageLinks').checked = res["settings"]["ignoreNonImageLinks"];
    });
}