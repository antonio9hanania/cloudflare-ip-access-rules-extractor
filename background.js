chrome.runtime.onInstalled.addListener(function () {
  console.log("Cloudflare IP Access Rules Extractor installed");
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "log") {
    console.log("Extension log:", request.message);
  }
});
