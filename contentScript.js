const isTopFrame = window === window.top;
const frameInfo = isTopFrame ? "TOP FRAME" : `IFRAME (${window.location.href})`;

console.log(`[CONTENT SCRIPT] Loaded in ${frameInfo}`);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "searchText") {
		const text = request.text;
		console.log(`[${frameInfo}] ============================================`);
		console.log(`[${frameInfo}] Received searchText request for: "${text}"`);

		// Search in THIS frame's document
		const bodyText = document.body?.innerText || document.body?.textContent || "";
		console.log(`[${frameInfo}] Document text length: ${bodyText.length}`);
		console.log(`[${frameInfo}] First 200 chars: ${bodyText.substring(0, 200)}`);

		const found = bodyText.includes(text);
		console.log(`[${frameInfo}] Found: ${found}`);
		console.log(`[${frameInfo}] ============================================`);

		sendResponse({ found: found });
	}
	return true;
});
