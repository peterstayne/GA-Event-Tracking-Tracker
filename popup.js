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
                let countUntil;
                if(bgeo.length > 100) {
                    countUntil = bgeo.length - 100;
                } else {
                    countUntil = -1;
                }
                let cols = {};
                for(var i = bgeo.length-1; i > countUntil; i--) {
                    if(typeof bgeo[i].data === 'undefined') continue;
                    if(tabfilter != 'all' && bgeo[i].tabid != tabfilter) continue;
                    Object.keys(bgeo[i].data).forEach(function(k) {
                        if(k != 'Category') cols[k] = true;
                    });
                }
                let colnames = Object.keys(cols);
                let csv = 'URL,UA String,Time,Category';
                colnames.forEach(function(cname) {
                    csv+= ',"' + cname + '"';
                });
                csv+= "\n";

                for(let i = bgeo.length-1; i > countUntil; i--) {
                     if(typeof bgeo[i].data === 'undefined') continue;
                    if(tabfilter != 'all' && bgeo[i].tabid != tabfilter) continue;
                   csv += bgeo[i].referer + ",";
                    csv += bgeo[i].uacode + ",";
                    csv += bgeo[i].ts + ",";
                    csv += '"' + bgeo[i].data.Category + '"';

                    colnames.forEach(function(cname) {
                        if(bgeo[i].data[cname]) {
                            csv += ',"' + bgeo[i].data[cname] + '"';
                        } else {
                            csv += ',';
                        }
                    });
                    csv += "\n";
                }
                let he = document.createElement('a');  
                he.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);  
                he.target = '_blank';  
                he.download = 'EventTrackingTracker.csv';  
                he.click();  
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
                let cols = {};
                for(var i = bgeo.length-1; i > countUntil; i--) {
                    if(typeof bgeo[i].data === 'undefined') continue;
                    if(tabfilter != 'all' && bgeo[i].tabid != tabfilter) continue;
                    numRows+=1;
                    Object.keys(bgeo[i].data).forEach(function(k) {
                        if(k != 'Category') cols[k] = true;
                    });
                }                
                let colnames = Object.keys(cols);
                // console.log(colnames, cols);
                let evhead = '<tr>';
                    evhead+= '<th><a href="#" id="expander">URL <span class="harr">&harr;</span></a></th>';
                    evhead+= '<th>UA String</th>';
                    evhead+= '<th>Time</th>';
                    evhead+= '<th>Category</th>';
                    colnames.forEach(function(cname) {
                        evhead+= '<th>' + cname + '</th>';
                    });
                    evhead+= '</tr>';
                document.getElementById('event-list-head').innerHTML = evhead;

                for(var i = bgeo.length-1; i > countUntil; i--) {
                    if(typeof bgeo[i].data === 'undefined') continue;
                    if(tabfilter != 'all' && bgeo[i].tabid != tabfilter) continue;
                    if(bgeo[i].referer.length > 37) {
                        dispURL = bgeo[i].referer.substr(0, 32) + ' ...';
                    } else {
                        dispURL = bgeo[i].referer;
                    }
                    newhtml += '<tr class="entry">';
                        newhtml += '<td class="url">';
                            newhtml += '<span class="compact">' + dispURL + '</span>';
                            newhtml += '<span class="full">' + bgeo[i].referer + '</span>';
                        newhtml += '</td>';
                        newhtml += '<td class="uastring">' + bgeo[i].uacode + '</td>';
                        newhtml += '<td class="uastring">' + bgeo[i].ts + '</td>';
                        newhtml += '<td class="category">' + bgeo[i].data.Category + '</td>';
                        colnames.forEach(function(cname) {
                            if(bgeo[i].data[cname]) {
                                newhtml += '<td>' + bgeo[i].data[cname] + '</td>';
                            } else {
                                newhtml += '<td>&nbsp;</td>';
                            }
                        });
                    newhtml += '</tr>';
                }
            }
            if(!numRows) {
                newhtml = '<tr><td colspan="100%" align="center" class="no-results">';
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
            let prefs_tab = await readLocalStorage('prefs_tab');
            if(typeof result != 'undefined' && typeof result.eventlist != 'undefined') {
                bgeo = result.eventlist;
            }
            if(typeof prefs_tab != 'undefined' && typeof prefs_tab != 'undefined') {
                tabfilter = prefs_tab;
            }
            chrome.tabs.query({active: true}, function(tabs) {
                // console.log('tabs', tabs);
                var tabhtml = '<a href="#" class="tab ';
                var found = false;
                if(tabfilter == 'all-tabs') {
                    tabhtml += 'active';
                    found = true;
                }
                tabhtml += ' all-tabs" id="all-tabs">All Tabs</a>';
                tabs.forEach(function(i) {
                    if(i.url.substr(0,10) != 'chrome-ext') {
                        let title = i.title;
                        if(title.length > 20) title = title.substr(0,18) + '...'
                        tabhtml += '<a href="#" class="tab ';
                        if(tabfilter == i.id) {
                            tabhtml += 'active ';
                            found = true;
                        }
                        let fi = i.favIconUrl;
                        if(!fi) {
                            fi = 'NoImage.png'
                        }
                        tabhtml += 'one-tab" id="tab' + i.id + '" data-tabid="' + i.id + '"><img src="' + fi + '" width="16" height="16" /> ' + title + '</a>';
                    }
                });
                document.getElementById('tabs-container').innerHTML = tabhtml;
                if(!found) {
                    chrome.storage.local.set({ 'prefs_tab': 'all-tabs' });
                }
            });
            if(tabfilter == 'all-tabs') {
                if(target == 'web') {
                    updateTable(bgeo, 'all');
                } else if(target == 'csv') {
                    createCSV(bgeo, 'all');
                }
            } else {
                if(target == 'web') {
                    updateTable(bgeo, tabfilter);
                } else if(target == 'csv') {
                    createCSV(bgeo, tabfilter);
                }
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
            document.getElementById('event-table').onclick = function(e) {
                for (var target=e.target; target && target!=this; target=target.parentNode) {
                    if(target.matches('#expander')) {
                        var table = document.getElementById('event-table');
                        var tableClasses = table.classList;
                        if(tableClasses.contains('wrapit')) {
                            tableClasses.remove('wrapit');
                            chrome.storage.local.set({ 'prefs_expander': 'unexpanded' });
                        } else {
                            tableClasses.add('wrapit');
                            chrome.storage.local.set({ 'prefs_expander': 'expanded' });
                        }
                        updateList();
                    }
                }
            };
            updateList();
            setInterval(updateList, 3500);
            document.getElementById('reset-list').onclick = function() {
                chrome.storage.local.set({ 'gae': { eventlist: [] }});
                updateList();
            };
            document.getElementById('tabs-container').onclick = function(e) {
                // console.log(e.target);
                for (var target=e.target; target && target!=this; target=target.parentNode) {
                    if(target.matches('.tab')) {
                        switchTab(target.id);
                        break;
                    }
                }
                if(target.id == 'all-tabs') {
                    chrome.storage.local.set({ 'prefs_tab': 'all-tabs' });
                } else {
                    chrome.storage.local.set({ 'prefs_tab': target.dataset.tabid });
                }
                updateList();
            };
            document.getElementById('export-list').onclick = function() {
                updateList('csv');
            };
            chrome.storage.local.get(['prefs_tab'], function (result) {
                if(typeof result.prefs_tab != 'undefined') {
                    switchTab(result.prefs_tab);
                } else {
                    chrome.storage.local.set({ 'prefs_tab': 'all-tabs' });
                }
            });
            chrome.storage.local.get(['prefs_expander'], function (result) {
                if(typeof result.prefs_expander != 'undefined') {
                    if(result.prefs_expander == 'expanded') {
                        document.getElementById('event-table').classList.add('wrapit');
                    }
                }
            });
            chrome.storage.local.get(['prefs_width', 'prefs_height'], function (result) {
                if(typeof result.prefs_width != 'undefined' && typeof result.prefs_height != 'undefined') {
                    window.resizeTo(result.prefs_width, result.prefs_height);
                }
            });            
            // document.getElementById('alwaysontop').onchange = function() {
            //     var alwaysOnTop;
            //     if(this.checked) { 
            //         alwaysOnTop = false;
            //     } else {
            //         alwaysOnTop = true;
            //     }
            //     chrome.storage.local.get(['cw'], function (result) {
            //         console.log(result);
            //         result.cw.alwaysOnTop = alwaysOnTop;
            //     });
            // };
        };
        window.onresize = function() {
            chrome.storage.local.set({ 'prefs_width': window.innerWidth });
            chrome.storage.local.set({ 'prefs_height': window.innerHeight });
        }
  const readLocalStorage = async (key) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], function (result) {
          resolve(result[key]);
      });
    });
  };
