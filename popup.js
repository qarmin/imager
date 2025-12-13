document.addEventListener("DOMContentLoaded", () => {
	// Load saved closer rules and active mode
	chrome.storage.local.get(["closerRules", "remaining", "timeRemaining", "activeMode"], (result) => {
		if (result.closerRules) {
			document.getElementById("closerRules").value = result.closerRules;
		}
		if (result.remaining !== undefined) {
			document.getElementById("remaining").textContent = `Remaining links: ${result.remaining}`;
		}
		if (result.timeRemaining !== undefined) {
			document.getElementById("time").textContent = `Time remaining: ${result.timeRemaining}s`;
		}
		// Restore last active mode (default to opener)
		const activeMode = result.activeMode || "opener";
		switchMode(activeMode);
	});

	// Mode switching
	document.getElementById("openerMode").addEventListener("click", () => {
		switchMode("opener");
	});

	document.getElementById("closerMode").addEventListener("click", () => {
		switchMode("closer");
	});
});

function switchMode(mode) {
	if (mode === "opener") {
		document.getElementById("openerMode").classList.add("active");
		document.getElementById("closerMode").classList.remove("active");
		document.getElementById("openerContent").classList.add("active");
		document.getElementById("closerContent").classList.remove("active");
	} else {
		document.getElementById("openerMode").classList.remove("active");
		document.getElementById("closerMode").classList.add("active");
		document.getElementById("openerContent").classList.remove("active");
		document.getElementById("closerContent").classList.add("active");
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

document.getElementById("checkRules").addEventListener("click", () => {
	const rules = document.getElementById("closerRules").value;
	const statsDiv = document.getElementById("stats");

	statsDiv.innerHTML = '<div style="text-align: center;">Checking tabs...</div>';

	chrome.runtime.sendMessage(
		{
			action: "checkCloserRules",
			rules: rules,
		},
		(response) => {
			if (response) {
				let html = `<div><strong>Statistics:</strong></div>`;
				html += `<div class="stat-item">Total tabs: ${response.totalTabs}</div>`;
				html += `<div class="stat-item">Tabs to close: ${response.tabs.length}</div>`;
				html += `<div class="stat-item">Tabs to keep: ${response.totalTabs - response.tabs.length}</div>`;
				html += `<br><div><strong>Matches per rule:</strong></div>`;

				for (const [rule, count] of Object.entries(response.stats)) {
					html += `<div class="stat-item">"${rule}": ${count} tab(s)</div>`;
				}

				statsDiv.innerHTML = html;
			} else {
				statsDiv.innerHTML = '<div style="color: red;">Error checking rules</div>';
			}
		},
	);
});

document.getElementById("closeRules").addEventListener("click", async () => {
	const rules = document.getElementById("closerRules").value;
	const statsDiv = document.getElementById("stats");

	const confirmed = await showConfirm("Are you sure you want to close matching tabs?");
	if (!confirmed) {
		return;
	}

	statsDiv.innerHTML = '<div style="text-align: center;">Closing tabs...</div>';

	chrome.runtime.sendMessage(
		{
			action: "closeMatchingTabs",
			rules: rules,
		},
		(response) => {
			if (response) {
				let html = `<div><strong>Result:</strong></div>`;
				html += `<div class="stat-item">Closed: ${response.closed} tab(s)</div>`;
				html += `<div class="stat-item">Kept: ${response.kept} tab(s)</div>`;
				if (response.emptyCreated) {
					html += `<div class="stat-item" style="color: green;">Created empty tab</div>`;
				}

				statsDiv.innerHTML = html;
			} else {
				statsDiv.innerHTML = '<div style="color: red;">Error closing tabs</div>';
			}
		},
	);
});
