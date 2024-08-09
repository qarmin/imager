document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("#followAElements").addEventListener("change", saveOptions);
document.querySelector("#ignoreNonImageLinks").addEventListener("change", saveOptions);
document.querySelector("#loadImagesLazy").addEventListener("change", saveOptions);
document.querySelector("#rowsNumber").addEventListener("change", saveOptions);
document.querySelector("#minimumImageSize").addEventListener("change", saveOptions);
document.querySelector("#ignoredElements").addEventListener("change", saveOptions);
document.querySelector("#ignoredElementsLinksMode").addEventListener("change", saveOptions);

function saveOptions(e) {
	let key = e.target.id;
	browser.storage.local.get("settings").then((res) => {
		modifiedSettings = res["settings"];
		if (["followAElements", "ignoreNonImageLinks", "loadImagesLazy"].includes(key)) {
			modifiedSettings[key] = e.target.checked;
		} else if (["rowsNumber", "minimumImageSize", "ignoredElements", "ignoredElementsLinksMode"].includes(key)) {
			modifiedSettings[key] = e.target.value;
		} else {
			console.error("Error saving option", e);
		}

		browser.storage.local.set({
			settings: modifiedSettings,
		});
	});
}

function restoreOptions() {
	browser.storage.local.get("settings").then((res) => {
		document.querySelector("#followAElements").checked = res["settings"]["followAElements"];
		document.querySelector("#ignoreNonImageLinks").checked = res["settings"]["ignoreNonImageLinks"];
		document.querySelector("#loadImagesLazy").checked = res["settings"]["loadImagesLazy"];
		document.querySelector("#rowsNumber").value = res["settings"]["rowsNumber"];
		document.querySelector("#minimumImageSize").value = res["settings"]["minimumImageSize"];
		document.querySelector("#ignoredElements").value = res["settings"]["ignoredElements"];
		document.querySelector("#ignoredElementsLinksMode").value = res["settings"]["ignoredElementsLinksMode"];
	});
}
