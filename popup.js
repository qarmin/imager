document.addEventListener("DOMContentLoaded", () => {
	// Load saved closer rules and active mode
	chrome.storage.local.get(
		[
			"closerRules",
			"remaining",
			"timeRemaining",
			"activeMode",
			"dontWaitForLoad",
			"seenThisFilters",
			"seenThisExclusions",
		],
		(result) => {
			if (result.closerRules) {
				document.getElementById("closerRules").value = result.closerRules;
			}
			if (result.remaining !== undefined) {
				document.getElementById("remaining").textContent = `Remaining links: ${result.remaining}`;
			}
			if (result.timeRemaining !== undefined) {
				document.getElementById("time").textContent = `Time remaining: ${result.timeRemaining}s`;
			}
			// Restore dontWaitForLoad checkbox (default to true if not set)
			const dontWaitForLoad = result.dontWaitForLoad !== undefined ? result.dontWaitForLoad : true;
			document.getElementById("dontWaitForLoad").checked = dontWaitForLoad;

			// Load SeenThis data
			if (result.seenThisFilters) {
				document.getElementById("seenThisFilters").value = result.seenThisFilters;
			}
			if (result.seenThisExclusions) {
				document.getElementById("seenThisExclusions").value = result.seenThisExclusions;
			}

			// Restore last active mode (default to opener)
			const activeMode = result.activeMode || "opener";
			switchMode(activeMode);
		},
	);

	// Mode switching
	document.getElementById("openerMode").addEventListener("click", () => {
		switchMode("opener");
	});

	document.getElementById("closerMode").addEventListener("click", () => {
		switchMode("closer");
	});

	document.getElementById("seenThisMode").addEventListener("click", () => {
		switchMode("seenthis");
	});

	document.getElementById("settingsMode").addEventListener("click", () => {
		switchMode("settings");
	});

	// Load settings when popup opens
	loadSettings();

	// Add event listeners for settings
	setupSettingsListeners();
});

function switchMode(mode) {
	// Deactivate all buttons and content
	document.getElementById("openerMode").classList.remove("active");
	document.getElementById("closerMode").classList.remove("active");
	document.getElementById("seenThisMode").classList.remove("active");
	document.getElementById("settingsMode").classList.remove("active");
	document.getElementById("openerContent").classList.remove("active");
	document.getElementById("closerContent").classList.remove("active");
	document.getElementById("seenThisContent").classList.remove("active");
	document.getElementById("settingsContent").classList.remove("active");

	// Activate selected mode
	if (mode === "opener") {
		document.getElementById("openerMode").classList.add("active");
		document.getElementById("openerContent").classList.add("active");
	} else if (mode === "closer") {
		document.getElementById("closerMode").classList.add("active");
		document.getElementById("closerContent").classList.add("active");
	} else if (mode === "seenthis") {
		document.getElementById("seenThisMode").classList.add("active");
		document.getElementById("seenThisContent").classList.add("active");
	} else if (mode === "settings") {
		document.getElementById("settingsMode").classList.add("active");
		document.getElementById("settingsContent").classList.add("active");
	}
	// Save active mode to storage
	chrome.storage.local.set({ activeMode: mode });
}

// ==== OPENER MODE ====

document.getElementById("start").addEventListener("click", () => {
	let links = document
		.getElementById("links")
		.value.split("\n")
		.map((link) => link.trim())
		.filter((link) => link);

	// Add https:// prefix if protocol is missing
	links = links.map((link) => {
		if (!link.match(/^[a-zA-Z]+:\/\//)) {
			return "https://" + link;
		}
		return link;
	});

	let delay = parseInt(document.getElementById("delay").value) * 1000;
	let waitForLoad = document.getElementById("waitForLoad").checked;

	chrome.runtime.sendMessage({ links: links, delay: delay, waitForLoad: waitForLoad });
});

document.getElementById("stop").addEventListener("click", () => {
	chrome.runtime.sendMessage({ action: "stop" });
	document.getElementById("links").value = "";
	document.getElementById("remaining").textContent = "Remaining links: 0";
	document.getElementById("time").textContent = "Time remaining: 0s";
});

// ==== CLOSER MODE ====

// Custom confirm modal
function showConfirm(message) {
	return new Promise((resolve) => {
		const modal = document.getElementById("confirmModal");
		const modalMessage = document.getElementById("modalMessage");
		const modalConfirm = document.getElementById("modalConfirm");
		const modalCancel = document.getElementById("modalCancel");

		modalMessage.textContent = message;
		modal.classList.add("active");

		const handleConfirm = () => {
			modal.classList.remove("active");
			modalConfirm.removeEventListener("click", handleConfirm);
			modalCancel.removeEventListener("click", handleCancel);
			resolve(true);
		};

		const handleCancel = () => {
			modal.classList.remove("active");
			modalConfirm.removeEventListener("click", handleConfirm);
			modalCancel.removeEventListener("click", handleCancel);
			resolve(false);
		};

		modalConfirm.addEventListener("click", handleConfirm);
		modalCancel.addEventListener("click", handleCancel);
	});
}

// Save rules whenever they change
document.getElementById("closerRules").addEventListener("input", () => {
	const rules = document.getElementById("closerRules").value;
	chrome.storage.local.set({ closerRules: rules });
});

// Save dontWaitForLoad checkbox state whenever it changes
document.getElementById("dontWaitForLoad").addEventListener("change", () => {
	const dontWaitForLoad = document.getElementById("dontWaitForLoad").checked;
	chrome.storage.local.set({ dontWaitForLoad: dontWaitForLoad });
	console.log("[POPUP] Saved dontWaitForLoad:", dontWaitForLoad);
});

document.getElementById("checkRules").addEventListener("click", () => {
	const rules = document.getElementById("closerRules").value;
	const dontWaitForLoad = document.getElementById("dontWaitForLoad").checked;
	const statsDiv = document.getElementById("stats");

	console.log("[POPUP] Check Rules button clicked!");
	console.log("[POPUP] Rules text:", rules);
	console.log("[POPUP] dontWaitForLoad:", dontWaitForLoad);

	statsDiv.textContent = "Checking tabs...";
	statsDiv.style.textAlign = "center";

	console.log("[POPUP] Sending checkCloserRules message to background...");
	chrome.runtime.sendMessage(
		{
			action: "checkCloserRules",
			rules: rules,
			dontWaitForLoad: dontWaitForLoad,
		},
		(response) => {
			console.log("[POPUP] Received response from background:", response);
			// Clear previous content
			statsDiv.textContent = "";
			statsDiv.style.textAlign = "";

			if (response) {
				// Create statistics header
				const headerDiv = document.createElement("div");
				const headerStrong = document.createElement("strong");
				headerStrong.textContent = "Statistics:";
				headerDiv.appendChild(headerStrong);
				statsDiv.appendChild(headerDiv);

				// Total tabs
				const totalDiv = document.createElement("div");
				totalDiv.className = "stat-item";
				totalDiv.textContent = `Total tabs: ${response.totalTabs}`;
				statsDiv.appendChild(totalDiv);

				// Tabs to close
				const toCloseDiv = document.createElement("div");
				toCloseDiv.className = "stat-item";
				toCloseDiv.textContent = `Tabs to close: ${response.tabs.length}`;
				statsDiv.appendChild(toCloseDiv);

				// Tabs to keep
				const toKeepDiv = document.createElement("div");
				toKeepDiv.className = "stat-item";
				toKeepDiv.textContent = `Tabs to keep: ${response.totalTabs - response.tabs.length}`;
				statsDiv.appendChild(toKeepDiv);

				// Skipped tabs (if any)
				if (response.skippedTabs !== undefined && response.skippedTabs > 0) {
					const skippedDiv = document.createElement("div");
					skippedDiv.className = "stat-item";
					skippedDiv.style.color = "#ff9800";
					skippedDiv.textContent = `Skipped (not loaded): ${response.skippedTabs}`;
					statsDiv.appendChild(skippedDiv);
				}

				// Line break
				statsDiv.appendChild(document.createElement("br"));

				// Matches per rule header
				const rulesHeaderDiv = document.createElement("div");
				const rulesHeaderStrong = document.createElement("strong");
				rulesHeaderStrong.textContent = "Matches per rule:";
				rulesHeaderDiv.appendChild(rulesHeaderStrong);
				statsDiv.appendChild(rulesHeaderDiv);

				// Individual rule stats
				for (const [rule, count] of Object.entries(response.stats)) {
					const ruleDiv = document.createElement("div");
					ruleDiv.className = "stat-item";
					ruleDiv.textContent = `"${rule}": ${count} tab(s)`;
					statsDiv.appendChild(ruleDiv);
				}
			} else {
				const errorDiv = document.createElement("div");
				errorDiv.style.color = "red";
				errorDiv.textContent = "Error checking rules";
				statsDiv.appendChild(errorDiv);
			}
		},
	);
});

document.getElementById("closeRules").addEventListener("click", async () => {
	const rules = document.getElementById("closerRules").value;
	const dontWaitForLoad = document.getElementById("dontWaitForLoad").checked;
	const statsDiv = document.getElementById("stats");

	console.log("[POPUP] Close Rules button clicked!");
	console.log("[POPUP] Rules text:", rules);
	console.log("[POPUP] dontWaitForLoad:", dontWaitForLoad);

	const confirmed = await showConfirm("Are you sure you want to close matching tabs?");
	console.log("[POPUP] User confirmed:", confirmed);
	if (!confirmed) {
		return;
	}

	statsDiv.textContent = "";
	statsDiv.style.textAlign = "center";
	const closingDiv = document.createElement("div");
	closingDiv.textContent = "Closing tabs...";
	statsDiv.appendChild(closingDiv);

	console.log("[POPUP] Sending closeMatchingTabs message to background...");
	chrome.runtime.sendMessage(
		{
			action: "closeMatchingTabs",
			rules: rules,
			dontWaitForLoad: dontWaitForLoad,
		},
		(response) => {
			console.log("[POPUP] Received response from background:", response);
			statsDiv.textContent = "";
			statsDiv.style.textAlign = "";

			if (response) {
				const resultHeaderDiv = document.createElement("div");
				const resultHeaderStrong = document.createElement("strong");
				resultHeaderStrong.textContent = "Result:";
				resultHeaderDiv.appendChild(resultHeaderStrong);
				statsDiv.appendChild(resultHeaderDiv);

				const closedDiv = document.createElement("div");
				closedDiv.className = "stat-item";
				closedDiv.textContent = `Closed: ${response.closed} tab(s)`;
				statsDiv.appendChild(closedDiv);

				const keptDiv = document.createElement("div");
				keptDiv.className = "stat-item";
				keptDiv.textContent = `Kept: ${response.kept} tab(s)`;
				statsDiv.appendChild(keptDiv);

				if (response.skippedTabs !== undefined && response.skippedTabs > 0) {
					const skippedDiv = document.createElement("div");
					skippedDiv.className = "stat-item";
					skippedDiv.style.color = "#ff9800";
					skippedDiv.textContent = `Skipped (not loaded): ${response.skippedTabs}`;
					statsDiv.appendChild(skippedDiv);
				}

				if (response.emptyCreated) {
					const emptyDiv = document.createElement("div");
					emptyDiv.className = "stat-item";
					emptyDiv.style.color = "green";
					emptyDiv.textContent = "Created empty tab";
					statsDiv.appendChild(emptyDiv);
				}
			} else {
				const errorDiv = document.createElement("div");
				errorDiv.style.color = "red";
				errorDiv.textContent = "Error closing tabs";
				statsDiv.appendChild(errorDiv);
			}
		},
	);
});

// ==== SETTINGS MODE ====

function loadSettings() {
	// Use chrome.storage instead of browser.storage for Chrome compatibility
	chrome.storage.local.get("settings", (res) => {
		if (res.settings) {
			const settings = res.settings;
			document.querySelector("#followAElements").checked = settings.followAElements || false;
			document.querySelector("#preserveSrcAndHref").checked = settings.preserveSrcAndHref || false;
			document.querySelector("#ignoreNonImageLinks").checked = settings.ignoreNonImageLinks || false;
			document.querySelector("#loadImagesLazy").checked = settings.loadImagesLazy || false;
			document.querySelector("#usingCustomImageGathering").checked = settings.usingCustomImageGathering || false;
			document.querySelector("#rowsNumber").value = settings.rowsNumber || 3;
			document.querySelector("#minimumImageSize").value = settings.minimumImageSize || 100;
			document.querySelector("#delayBetweenImages").value = settings.delayBetweenImages || 0;
			document.querySelector("#ignoredElements").value = settings.ignoredElements || "";
			document.querySelector("#ignoredElementsLinksMode").value = settings.ignoredElementsLinksMode || "";
			document.querySelector("#ignoreImageSize").checked = settings.ignoreImageSize || false;
			document.querySelector("#autoFilterEnabled").checked = settings.autoFilterEnabled || false;
			document.querySelector("#autoFilterDomains").value = settings.autoFilterDomains || "";
		}
	});
}

function setupSettingsListeners() {
	const settingsIds = [
		"followAElements",
		"preserveSrcAndHref",
		"ignoreNonImageLinks",
		"loadImagesLazy",
		"usingCustomImageGathering",
		"rowsNumber",
		"minimumImageSize",
		"delayBetweenImages",
		"ignoredElements",
		"ignoredElementsLinksMode",
		"ignoreImageSize",
		"autoFilterEnabled",
		"autoFilterDomains",
	];

	settingsIds.forEach((id) => {
		const element = document.getElementById(id);
		if (element) {
			element.addEventListener("change", saveSettings);
			// For textarea, also listen to input event
			if (element.tagName === "TEXTAREA") {
				element.addEventListener("input", saveSettings);
			}
		}
	});
}

function saveSettings(e) {
	const key = e.target.id;

	chrome.storage.local.get("settings", (res) => {
		let modifiedSettings = res.settings || {};

		if (
			[
				"followAElements",
				"ignoreNonImageLinks",
				"loadImagesLazy",
				"usingCustomImageGathering",
				"ignoreImageSize",
				"preserveSrcAndHref",
				"autoFilterEnabled",
			].includes(key)
		) {
			modifiedSettings[key] = e.target.checked;
		} else if (
			[
				"rowsNumber",
				"minimumImageSize",
				"ignoredElements",
				"ignoredElementsLinksMode",
				"delayBetweenImages",
				"autoFilterDomains",
			].includes(key)
		) {
			modifiedSettings[key] = e.target.value;
		} else {
			console.error("Error saving option", e);
			return;
		}

		chrome.storage.local.set(
			{
				settings: modifiedSettings,
			},
			() => {
				console.log("Settings saved:", key, modifiedSettings[key]);
			},
		);
	});
}

// ==== SEENTHIS MODE ====

// Save filters whenever they change
document.getElementById("seenThisFilters").addEventListener("input", () => {
	const filters = document.getElementById("seenThisFilters").value;
	chrome.storage.local.set({ seenThisFilters: filters });
});

// Save exclusions whenever they change
document.getElementById("seenThisExclusions").addEventListener("input", () => {
	const exclusions = document.getElementById("seenThisExclusions").value;
	chrome.storage.local.set({ seenThisExclusions: exclusions });
});

// Clear all filters
document.getElementById("clearFilters").addEventListener("click", async () => {
	const confirmed = await showConfirm("Are you sure you want to clear all filters?");
	if (confirmed) {
		document.getElementById("seenThisFilters").value = "";
		chrome.storage.local.set({ seenThisFilters: "" });
	}
});

// Listen for messages from background script (collected images)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "imagesCollected") {
		// Add collected images to the filter list
		const currentFilters = document.getElementById("seenThisFilters").value;
		const date = new Date();
		const dateStr = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

		// Build new entry (newest at the top)
		let newEntry = `// ${dateStr} - ${request.pageUrl}\n`;
		newEntry += request.urls.join("\n");
		newEntry += "\n\n";

		// Prepend to existing filters
		const updatedFilters = newEntry + currentFilters;
		document.getElementById("seenThisFilters").value = updatedFilters;
		chrome.storage.local.set({ seenThisFilters: updatedFilters });

		console.log("[SeenThis] Added", request.urls.length, "URLs to filter list");
	}

	// Keep existing message handlers
	if (request.remaining !== undefined) {
		document.getElementById("remaining").textContent = `Remaining links: ${request.remaining}`;
	}
	if (request.timeRemaining !== undefined) {
		document.getElementById("time").textContent = `Time remaining: ${request.timeRemaining}s`;
		if (request.remaining === 0) {
			document.getElementById("start").disabled = false;
		}
	}
});
