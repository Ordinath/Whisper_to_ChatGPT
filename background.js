chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed!');
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
  });
  