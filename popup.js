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

	console.log("[POPUP] Check Rules button clicked!");
	console.log("[POPUP] Rules text:", rules);

	statsDiv.textContent = "Checking tabs...";
	statsDiv.style.textAlign = "center";

	console.log("[POPUP] Sending checkCloserRules message to background...");
	chrome.runtime.sendMessage(
		{
			action: "checkCloserRules",
			rules: rules,
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
	const statsDiv = document.getElementById("stats");

	console.log("[POPUP] Close Rules button clicked!");
	console.log("[POPUP] Rules text:", rules);

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
