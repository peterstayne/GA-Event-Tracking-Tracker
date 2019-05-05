
    // Array to hold callback functions
    var callbacks = []; 
    var eventObject = [];
    /**
     * Credit
     * http://stackoverflow.com/questions/901115/get-query-string-values-in-javascript/901144#901144
     */
    function getParameterByName( url, name ) {
        name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");

        var regexS = "[\\?&]" + name + "=([^&#]*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(url);

        if ( results === null ) {
            return '';
        } else {
            return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    }

    // This function is called onload in the popup code
    function getPageInfo(callback) 
    { 
        // Add the callback to the queue
        callbacks.push(callback); 

        // Injects the content script into the current page 
        chrome.tabs.executeScript(null, { file: "content_script.js" }); 
    }; 

    // Perform the callback when a request is received from the content script
    chrome.extension.onRequest.addListener(function(request) 
    { 
        // Get the first callback in the callbacks array
        // and remove it from the array
        var callback = callbacks.shift();

        // Call the callback function
        callback(request); 
    }); 
    chrome.webRequest.onBeforeSendHeaders.addListener(
      function(details) {
        console.log(details)
        var referer, eventString, uacode;
        var category, action, label, val;
        for (var i = 0; i < details.requestHeaders.length; ++i) {
          if (details.requestHeaders[i].name === 'User-Agent') {
            details.requestHeaders.splice(i, 1);
            break;
          }
        }
        if(details.url.indexOf('google-analytics.com/collect') > -1 && getParameterByName(details.url, 't').toLowerCase() === 'event') {

            referer = tabid = eventString = uacode = category = action = label = val = '<i>null</i>';

            tabid = details.tabId;
            category = getParameterByName(details.url, 'ec');
            action = getParameterByName(details.url, 'ea');
            label = getParameterByName(details.url, 'el');
            val = getParameterByName(details.url, 'ev');
            uacode = getParameterByName(details.url, 'tid');
            referer = getParameterByName(details.url, 'dl');

            eventObject.push([referer, uacode, category, action, label, val, tabid]);
            if(eventObject.length > 25) eventObject.shift();
        }
        if(details.url.indexOf('_utm') > -1) {

            referer = eventString = uacode = category = action = label = val = '<i>null</i>';

            for(var i in details.requestHeaders) {
                if(details.requestHeaders[i].name == "Referer") {
                    referer = details.requestHeaders[i].value;
                }
            }
            eventString = getParameterByName(details.url, 'utme');

            if(eventString.substr(0,1) === '5') {

                if(eventString.indexOf(')8(') > -1) eventString = eventString.substring(0, eventString.indexOf(')8(') + 1);
                if(eventString.indexOf(')9(') > -1) eventString = eventString.substring(0, eventString.indexOf(')9(') + 1);
                if(eventString.indexOf(')11(') > -1) eventString = eventString.substring(0, eventString.indexOf(')11(') + 1);
                eventString = eventString.substring(2, eventString.length - 1).split(/\*|\)\(/);
                category = eventString[0];
                action = eventString[1];
                if(eventString.length > 2) {
                    label = eventString[2]; 
                    if(eventString.length > 3) {
                        val = eventString[3]; 
                    }
                }
                uacode = getParameterByName(details.url, 'utmac');
                eventObject.push([referer, uacode, category, action, label, val]);
                if(eventObject.length > 15) eventObject.shift();
                console.log(eventObject);

            }
        }
        return {requestHeaders: details.requestHeaders};
      },
      {urls: ["<all_urls>"]},
      ["requestHeaders"]
    );
