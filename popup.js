        // This callback function is called when the content script has been 
        // injected and returned its results
        function onPageInfo(o) 
        { 
        } 

        // POST the data to the server using XMLHttpRequest
        function addBookmark(f)
        {
            return false;
        }

        function updateList() {
            // console.log(chrome.storage.local);
            chrome.storage.local.get('etev').then((bgeo) => {

                // var bgeo = getEvents();
                console.log('bgeo', bgeo);
                var newhtml = '';
                var dispURL = '';
                if(bgeo.length) {
                    var countUntil;
                    if(bgeo.length > 15) {
                        countUntil = bgeo.length - 15;
                    } else {
                        countUntil = -1;
                    }
                    for(var i = bgeo.length-1; i > countUntil; i--) {
                        if(bgeo[i][0].length > 37) {
                            dispURL = bgeo[i][0].substr(0, 32) + ' ...';
                        } else {
                            dispURL = bgeo[i][0];
                        }
                        newhtml += '<tr class="entry">';
                            newhtml += '<td class="url">';
                                newhtml += '<span class="compact">' + dispURL + '</span>';
                                newhtml += '<span class="full">' + bgeo[i][0] + '</span>';
                            newhtml += '</td>';
                            newhtml += '<td class="uastring">' + bgeo[i][1] + '</td>';
                            newhtml += '<td>' + bgeo[i][2] + '</td>';
                            newhtml += '<td>' + bgeo[i][3] + '</td>';
                            newhtml += '<td>' + bgeo[i][4] + '</td>';
                            newhtml += '<td>' + bgeo[i][5] + '</td>';
                        newhtml += '</tr>';
                    }
                    document.getElementById('event-list').innerHTML = newhtml;
                } else {
                    newhtml = '<tr><td colspan="6" align="center" class="no-results">';
                    newhtml += '<p><i>No events recorded yet.</i></p>';
                    newhtml += '<p><i><a href="https://developers.google.com/analytics/devguides/collection/analyticsjs/events" target="_top">Google\'s Event documentation page</a></i></p>';
                    newhtml += '<p><i>Note: Some ad blockers like uBlock Origin block events from firing.</i></p>';
                    newhtml += '</td></tr>';

                    document.getElementById('event-list').innerHTML = newhtml;
                }
            });
        }

        // Call the getPageInfo function in the background page, passing in 
        // our onPageInfo function as the callback
        window.onload = function() { 
            document.getElementById('expander').onclick = function() {
                var table = document.getElementById('event-table');
                var tableClasses = table.classList;
                if(tableClasses.contains('wrapit')) {
                    tableClasses.remove('wrapit');
                } else {
                    tableClasses.add('wrapit');
                }
            };
            updateList();
            setInterval(updateList, 3000);
            document.getElementById('reset-list').onclick = function() {
                chrome.extension.getBackgroundPage().eventObject = [];
                updateList();
            };
            document.getElementById('export-list').onclick = function() {
                chrome.extension.getBackgroundPage().eventObject = [];
                updateList();
            };
        };