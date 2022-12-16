
    // Array to hold callback functions
    // var callbacks = []; 
    // var eventObject = [];

    function getEvents() {
        return chrome.storage.local.get('gae');
    }

    function saveEvents(events) {
        return chrome.storage.local.set({ 'gae': { eventlist: events }});
    }

    function addEvent(pushData) {
        getEvents().then((result) => { 
            // console.log('result', result);
            if(typeof result.gae == 'undefined') {
                result.gae = { 'eventlist': [] };
            }
            if(typeof result.gae.eventlist === 'undefined') {
                result.gae.eventlist = [];
            }
            result.gae.eventlist.push(pushData); 
            saveEvents(result.gae.eventlist); 
        });
    }

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
        // console.log('in here');
        // Injects the content script into the current page 
        chrome.tabs.executeScript(null, { file: "content_script.js" }); 
    }; 

    // Perform the callback when a request is received from the content script
    chrome.runtime.onMessage.addListener(function(request) 
    { 
        // Get the first callback in the callbacks array
        // and remove it from the array
        // console.log('orq', request);
        var callback = callbacks.shift();

        // Call the callback function
        callback(request); 
    }); 
    chrome.webRequest.onBeforeSendHeaders.addListener(
      function(details) {
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

            addEvent([referer, uacode, category, action, label, val, tabid]);
            // if(eventObject.length > 25) eventObject.shift();
        }
        if(details.url.indexOf('google-analytics.com/g/collect') > -1 && getParameterByName(details.url, '_ee') == 1 && getParameterByName(details.url, 'en') != 'page_view') {
            // console.log('obsh', details.url, details)
            referer = tabid = eventString = property = uacode = category = action = label = val = '<i>null</i>';

            let ps = new URLSearchParams(details.url);
            let evp = {};

            for (const key of ps.keys()) {
                if(key.substr(0,3) == 'ep.') {
                    evp[key.substr(3)] = ps.get(key);
                }
                if(key.substr(0,4) == 'epn.') {
                    evp[key.substr(4)] = ps.get(key) + 0;
                }
            }
            // console.log('evp', evp)

            tabid = details.tabId;
            category = getParameterByName(details.url, 'en');
            // action = getParameterByName(details.url, 'ea');
            // label = getParameterByName(details.url, 'el');
            val = JSON.stringify(evp);
            uacode = getParameterByName(details.url, 'tid');
            property = getParameterByName(details.url, 'dt');
            referer = getParameterByName(details.url, 'dl');

            // console.log(ps.keys());
            addEvent([referer, uacode, category, action, label, val, tabid]);
            // if(eventObject.length > 25) eventObject.shift();
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
                addEvent([referer, uacode, category, action, label, val]);
                // if(eventObject.length > 15) eventObject.shift();
                // console.log(eventObject);

            }
        }
        return {requestHeaders: details.requestHeaders};
      },
      {urls: ["<all_urls>"]},
      ["requestHeaders"]
    );

/*

https://www.google-analytics.com/g/collect?
v=2
&
tid=G-MG2R3W5D76
&
gtm=2oebu0
&
_p=1087094531
&
cid=1641160515.1670773322
&
ul=en-us
&
sr=1920x1080
&
_s=3
&
sid=1670960899
&
sct=6
&
seg=1
&
dl=http%3A%2F%2Fpetemilkman.com%2F
&
dt=pete%20milkman%20.%20com
&
en=topmenu
&
_ee=1
&
ep.label=experiments
&
_et=10487

*/