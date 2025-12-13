// Delayed tab opener functionality
let stopOpening = false;
let intervalId = null;
let currentTabOpeningIndex = 0;
let currentLinks = [];
let currentDelay = 0;
let useWaitForLoad = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "stop") {
		stopOpening = true;
		clearInterval(intervalId);
		chrome.storage.local.set({ remaining: 0, timeRemaining: 0 });
		console.log("[Tab Opener] Stopped by user");
		return;
	}

	if (request.links && request.delay !== undefined) {
		stopOpening = false;
		currentLinks = request.links;
		currentDelay = request.delay;
		useWaitForLoad = request.waitForLoad || false;
		currentTabOpeningIndex = 0;

		console.log(`[Tab Opener] ========================================`);
		console.log(`[Tab Opener] Starting new batch`);
		console.log(`[Tab Opener] Total links requested: ${currentLinks.length}`);
		console.log(`[Tab Opener] Delay between tabs: ${currentDelay}ms (${currentDelay / 1000}s)`);
		console.log(`[Tab Opener] Wait for full load: ${useWaitForLoad ? "ENABLED" : "DISABLED"}`);
		console.log(`[Tab Opener] Links to open:`);
		currentLinks.forEach((link, index) => {
			console.log(`[Tab Opener]   ${index + 1}. ${link}`);
		});
		console.log(`[Tab Opener] ========================================`);

		if (useWaitForLoad) {
			openNextLinkWithWait();
		} else {
			openLinksBatch(currentLinks, currentDelay, 0);
			startCountdown();
		}
	}
});

// New function for opening tabs with wait for load
function openNextLinkWithWait() {
	if (stopOpening || currentTabOpeningIndex >= currentLinks.length) {
		console.log("[Tab Opener] ========================================");
		console.log("[Tab Opener] Finished opening all tabs");
		console.log(`[Tab Opener] Total tabs opened: ${currentTabOpeningIndex}/${currentLinks.length}`);
		console.log("[Tab Opener] ========================================");
		chrome.storage.local.set({ remaining: 0, timeRemaining: 0 });
		chrome.runtime.sendMessage({ remaining: 0, timeRemaining: 0 });
		return;
	}

	const link = currentLinks[currentTabOpeningIndex];
	const requestTime = Date.now();
	const requestTimeISO = new Date(requestTime).toISOString();
	console.log(
		`[Tab Opener] [${currentTabOpeningIndex + 1}/${currentLinks.length}] Request to open: ${link} at ${requestTimeISO}`,
	);

	chrome.tabs.create({ url: link }, (tab) => {
		const tabId = tab.id;
		currentTabOpeningIndex++;

		const loadListener = (tabIdUpdated, changeInfo, tabUpdated) => {
			if (tabIdUpdated === tabId && changeInfo.status === "complete") {
				chrome.tabs.onUpdated.removeListener(loadListener);

				const loadTime = Date.now();
				const loadTimeISO = new Date(loadTime).toISOString();
				const duration = loadTime - requestTime;

				console.log(`[Tab Opener] Fully loaded: ${tabUpdated.url} at ${loadTimeISO} (took ${duration}ms)`);

				// Update remaining counter
				let remaining = currentLinks.length - currentTabOpeningIndex;
				chrome.storage.local.set({ remaining: remaining, timeRemaining: 0 });
				chrome.runtime.sendMessage({ remaining: remaining, timeRemaining: 0 });

				if (stopOpening) {
					console.log("[Tab Opener] ========================================");
					console.log("[Tab Opener] Opening process stopped by user");
					console.log(`[Tab Opener] Opened: ${currentTabOpeningIndex}/${currentLinks.length} tabs`);
					console.log("[Tab Opener] ========================================");
					return;
				}

				// Wait for delay before opening next
				if (currentDelay > 0 && currentTabOpeningIndex < currentLinks.length) {
					console.log(`[Tab Opener] Waiting ${currentDelay}ms before next tab...`);
					setTimeout(openNextLinkWithWait, currentDelay);
				} else if (currentTabOpeningIndex < currentLinks.length) {
					openNextLinkWithWait();
				}
			}
		};

		chrome.tabs.onUpdated.addListener(loadListener);
	});
}

function openLinksBatch(links, delay, startIndex) {
	if (stopOpening) {
		console.log("[Tab Opener] ========================================");
		console.log("[Tab Opener] Opening process stopped by user");
		console.log(`[Tab Opener] Opened: ${startIndex}/${links.length} tabs`);
		console.log("[Tab Opener] ========================================");
		return;
	}

	let batchSize = 1;
	let batch = links.slice(startIndex, startIndex + batchSize);

	batch.forEach((link) => {
		if (link) {
			const requestTime = new Date().toISOString();
			console.log(`[Tab Opener] [${startIndex + 1}/${links.length}] Opening: ${link} at ${requestTime}`);
			chrome.tabs.create({ url: link });
		}
	});

	let remaining = links.length - (startIndex + batchSize);
	let timeRemaining = Math.ceil((remaining * delay) / 1000);
	chrome.storage.local.set({ remaining: remaining, timeRemaining: timeRemaining });
	chrome.runtime.sendMessage({ remaining: remaining, timeRemaining: timeRemaining });

	if (startIndex + batchSize < links.length) {
		setTimeout(() => openLinksBatch(links, delay, startIndex + batchSize), delay);
	} else {
		clearInterval(intervalId);
		console.log("[Tab Opener] ========================================");
		console.log("[Tab Opener] Successfully finished opening all tabs");
		console.log(`[Tab Opener] Total tabs opened: ${links.length}`);
		console.log("[Tab Opener] ========================================");
	}
}

function startCountdown() {
	clearInterval(intervalId);
	intervalId = setInterval(() => {
		chrome.storage.local.get(["timeRemaining"], (result) => {
			if (result.timeRemaining > 0) {
				let newTimeRemaining = result.timeRemaining - 1;
				chrome.storage.local.set({ timeRemaining: newTimeRemaining });
				chrome.runtime.sendMessage({ timeRemaining: newTimeRemaining });
			} else {
				clearInterval(intervalId);
			}
		});
	}, 1000);
}
