// Content script for tab closer - searches for text on pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "searchText") {
		const text = request.text;
		const bodyText = document.body.innerText || document.body.textContent;
		const found = bodyText.includes(text);
		sendResponse({ found: found });
	}
	return true;
});
