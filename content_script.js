// Object to hold information about the current page
var pageInfo = {
    "title": document.title,
    "url": window.location.href,
    "summary": window.getSelection().toString()
};

console.log(pageInfo);
// Send the information back to the extension
chrome.runtime.sendMessage(pageInfo);