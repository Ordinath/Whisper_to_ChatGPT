// eslint-disable-next-line no-undef
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed!');
});

// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
});
