// Tab Closer functionality

// Parse rules from text
function parseCloserRules(text) {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line);
	const rules = [];

	for (const line of lines) {
		if (line.includes("---")) {
			const parts = line.split("---").map((p) => p.trim());
			if (parts[0] === "") {
				// --- text means apply to all pages
				rules.push({ url: null, text: parts[1] });
			} else {
				// url --- text
				rules.push({ url: parts[0], text: parts[1] });
			}
		}
	}

	return rules;
}

// Check which tabs match the rules
function checkTabsAgainstRules(rules, callback) {
	chrome.tabs.query({}, (tabs) => {
		if (rules.length === 0 || tabs.length === 0) {
			callback({ tabs: [], stats: {}, totalTabs: tabs.length });
			return;
		}

		let completed = 0;
		const totalChecks = tabs.length * rules.length;
		const results = new Map(); // tabId -> matching rules

		const checkComplete = () => {
			completed++;
			if (completed === totalChecks) {
				// All checks completed
				const matchingTabs = Array.from(results.values());

				// Calculate stats
				const stats = {};
				rules.forEach((rule) => {
					const ruleKey = rule.url ? `${rule.url} --- ${rule.text}` : `--- ${rule.text}`;
					stats[ruleKey] = 0;
				});

				matchingTabs.forEach((item) => {
					item.rules.forEach((rule) => {
						const ruleKey = rule.url ? `${rule.url} --- ${rule.text}` : `--- ${rule.text}`;
						stats[ruleKey]++;
					});
				});

				callback({
					tabs: matchingTabs,
					stats: stats,
					totalTabs: tabs.length,
				});
			}
		};

		tabs.forEach((tab) => {
			rules.forEach((rule) => {
				// Check URL match
				const urlMatches = !rule.url || tab.url.includes(rule.url);

				if (urlMatches && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")) {
					// Check if page contains the text
					chrome.tabs.sendMessage(tab.id, { action: "searchText", text: rule.text }, (response) => {
						if (chrome.runtime.lastError) {
							// Tab doesn't support content scripts (e.g., chrome:// pages)
							checkComplete();
							return;
						}

						if (response && response.found) {
							if (!results.has(tab.id)) {
								results.set(tab.id, {
									tab: tab,
									rules: [],
								});
							}
							results.get(tab.id).rules.push(rule);
						}

						checkComplete();
					});
				} else {
					checkComplete();
				}
			});
		});
	});
}

// Close tabs that match rules, but keep at least 1 tab
function closeMatchingTabs(rules, callback) {
	checkTabsAgainstRules(rules, (result) => {
		const tabIdsToClose = result.tabs.map((item) => item.tab.id);

		chrome.tabs.query({}, (allTabs) => {
			const totalTabs = allTabs.length;
			const tabsToClose = Math.min(tabIdsToClose.length, totalTabs - 1);

			if (tabsToClose <= 0) {
				// Need to keep at least one tab
				if (totalTabs === 0) {
					// Create an empty tab
					chrome.tabs.create({ url: "about:blank" }, () => {
						callback({ closed: 0, kept: 1, emptyCreated: true });
					});
				} else {
					callback({ closed: 0, kept: totalTabs, emptyCreated: false });
				}
				return;
			}

			// Close tabs but keep at least one
			const toClose = tabIdsToClose.slice(0, tabsToClose);
			let closed = 0;

			toClose.forEach((tabId) => {
				chrome.tabs.remove(tabId, () => {
					closed++;
					if (closed === toClose.length) {
						callback({
							closed: closed,
							kept: totalTabs - closed,
							emptyCreated: false,
						});
					}
				});
			});
		});
	});
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "checkCloserRules") {
		const rules = parseCloserRules(request.rules);
		checkTabsAgainstRules(rules, (result) => {
			sendResponse(result);
		});
		return true; // Keep channel open for async response
	}

	if (request.action === "closeMatchingTabs") {
		const rules = parseCloserRules(request.rules);
		closeMatchingTabs(rules, (result) => {
			sendResponse(result);
		});
		return true; // Keep channel open for async response
	}
});
