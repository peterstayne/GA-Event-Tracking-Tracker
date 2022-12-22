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

        function createCSV(bgeo, tabfilter) {
           if(bgeo.length) {
                var csv = 'URL,UA String,Category,Action,Label,Value,TabID' + "\n";
                var countUntil;
                if(bgeo.length > 100) {
                    countUntil = bgeo.length - 100;
                } else {
                    countUntil = -1;
                }
                for(var i = bgeo.length-1; i > countUntil; i--) {
                    if(tabfilter != 'all' && bgeo[i][6] != tabfilter) continue;
                    csv += '"' + bgeo[i].join('","') + '"' + "\n";
                }
                var hiddenElement = document.createElement('a');  
                hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);  
                hiddenElement.target = '_blank';  
                  
                //provide the name for the CSV file to be downloaded  
                hiddenElement.download = 'EventTrackingTracker.csv';  
                hiddenElement.click();  
           }
        }

        function updateTable(bgeo, tabfilter) {
            var newhtml = '';
            var dispURL = '';
            var numRows = 0;
            if(bgeo.length) {
                var countUntil;
                if(bgeo.length > 100) {
                    countUntil = bgeo.length - 100;
                } else {
                    countUntil = -1;
                }
                for(var i = bgeo.length-1; i > countUntil; i--) {
                    if(tabfilter != 'all' && bgeo[i][6] != tabfilter) continue;
                    numRows+=1;
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
                        if(bgeo[i][3] == '<i>null</i>' && bgeo[i][4] == '<i>null</i>' && bgeo[i][5] != '<i>null</i>') {
                            newhtml += '<td colspan="3">' + bgeo[i][5] + '</td>';
                        } else {
                            newhtml += '<td>' + bgeo[i][3] + '</td>';
                            newhtml += '<td>' + bgeo[i][4] + '</td>';
                            newhtml += '<td>' + bgeo[i][5] + '</td>';
                        }
                    newhtml += '</tr>';
                }
            }
            if(!numRows) {
                newhtml = '<tr><td colspan="6" align="center" class="no-results">';
                newhtml += '<p><i>No events recorded yet.</i></p>';
                newhtml += '<p><i><a href="https://support.google.com/analytics/answer/9322688?hl=en&ref_topic=9756175" target="_blank">Google\'s Event documentation page</a></i></p>';
                newhtml += '<p><i>Note: Some ad blockers like uBlock Origin block events from firing.</i></p>';
                newhtml += '</td></tr>';
            }
            document.getElementById('event-list').innerHTML = newhtml;            
        }

        async function updateList(target = "web") {
            let bgeo = [];
            let tabfilter = 'all-tabs';
            let result = await readLocalStorage('gae');
            let prefs = await readLocalStorage('prefs');
            if(typeof result.eventlist != 'undefined') {
                bgeo = result.eventlist;
            }
            if(typeof prefs != 'undefined' && typeof prefs.tabfilter != 'undefined') {
                tabfilter = prefs.tabfilter;

            }
            if(tabfilter == 'all-tabs') {
                if(target == 'web') {
                    updateTable(bgeo, 'all');
                } else if(target == 'csv') {
                    createCSV(bgeo, 'all');
                }
            } else {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                  var currTab = tabs[0];
                  if (currTab) { // Sanity check
                    if(target == 'web') {
                        updateTable(bgeo, currTab.id);
                    } else if(target == 'csv') {
                        createCSV(bgeo, currTab.id);
                    }
                  }
                });                    
            }
        }

        function switchTab(tabid) {
            document.querySelectorAll('.tab').forEach(function(i,a) {
                if(i.id != tabid) {
                    i.classList.remove('active');
                } else {
                    i.classList.add('active');
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
                    chrome.storage.local.set({ 'prefs': { expander: 'unexpanded' }});
                } else {
                    tableClasses.add('wrapit');
                    chrome.storage.local.set({ 'prefs': { expander: 'expanded' }});
                }
            };
            updateList();
            setInterval(updateList, 5000);
            document.getElementById('reset-list').onclick = function() {
                chrome.storage.local.set({ 'gae': { eventlist: [] }});
                updateList();
            };
            document.getElementById('this-tab').onclick = function() {
                switchTab('this-tab');
                chrome.storage.local.set({ 'prefs': { tabfilter: 'this-tab' }});
                updateList();
            };
            document.getElementById('all-tabs').onclick = function() {
                switchTab('all-tabs');
                chrome.storage.local.set({ 'prefs': { tabfilter: 'all-tabs' }});
                updateList();
            };
            document.getElementById('export-list').onclick = function() {
                updateList('csv');
            };
            chrome.storage.local.get(['prefs'], function (result) {
                if(typeof result.prefs != 'undefined') {
                    if(typeof result.prefs.tabfilter != 'undefined') {
                        switchTab(result.prefs.tabfilter);
                    }
                    if(typeof result.prefs.expander != 'undefined') {
                        if(result.prefs.expander == 'expanded') {
                            document.getElementById('event-table').classList.add('wrapit');
                        }
                    }
                }
            });
        };

  const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
          resolve(result[key]);
      });
    });
  };
