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
	console.log("[BACKGROUND] checkTabsAgainstRules called with", rules.length, "rules");
	chrome.tabs.query({}, (tabs) => {
		console.log("[BACKGROUND] Found", tabs.length, "tabs to check");
		if (rules.length === 0 || tabs.length === 0) {
			console.log("[BACKGROUND] No rules or tabs, returning empty result");
			callback({ tabs: [], stats: {}, totalTabs: tabs.length });
			return;
		}

		let completed = 0;
		const totalChecks = tabs.length * rules.length;
		const results = new Map(); // tabId -> matching rules
		console.log("[BACKGROUND] Total checks to perform:", totalChecks);

		const checkComplete = () => {
			completed++;
			console.log(`[BACKGROUND] Check complete ${completed}/${totalChecks}`);
			if (completed === totalChecks) {
				console.log("[BACKGROUND] All checks completed!");
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
					// Execute search in ALL frames of the tab
					console.log(`[BACKGROUND] Executing search in tab ${tab.id} for text: "${rule.text}"`);
					chrome.tabs.executeScript(
						tab.id,
						{
							allFrames: true,
							code: `
								(function() {
									const text = ${JSON.stringify(rule.text)};
									const bodyText = document.body?.innerText || document.body?.textContent || "";
									const found = bodyText.includes(text);
									const frameInfo = window === window.top ? "TOP" : "IFRAME";
									console.log("[EXEC] Frame: " + frameInfo + ", URL: " + window.location.href + ", Found: " + found);
									return found;
								})();
							`,
						},
						(frameResults) => {
							if (chrome.runtime.lastError) {
								console.log(`[BACKGROUND] Error in tab ${tab.id}:`, chrome.runtime.lastError.message);
								checkComplete();
								return;
							}

							// frameResults is an array - one result per frame
							// If ANY frame returns true, the text was found
							const foundInAnyFrame = frameResults && frameResults.some((result) => result === true);
							console.log(
								`[BACKGROUND] Tab ${tab.id} frameResults: ${frameResults ? frameResults.length : 0} frames, found in any: ${foundInAnyFrame}`,
							);

							if (foundInAnyFrame) {
								if (!results.has(tab.id)) {
									results.set(tab.id, {
										tab: tab,
										rules: [],
									});
								}
								results.get(tab.id).rules.push(rule);
							}

							checkComplete();
						},
					);
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
