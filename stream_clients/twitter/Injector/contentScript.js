var s = document.createElement("script");
s.type = "text/javascript"
s.src = chrome.runtime.getURL("script.js");
document.getElementsByTagName("html")[0].prepend(s);