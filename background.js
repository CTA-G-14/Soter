"use strict";

function updateLocalStorage(){
	chrome.storage.local.get("urls", function (url_array) {
		chrome.storage.local.get("allowed_ips", function(allowed_ips_array) {
			localStorage.urls = url_array.urls;
			localStorage.allowed_ips = allowed_ips_array.allowed_ips;
		});
	});
}
updateLocalStorage();

function getHostFromURL(url){
    var a = document.createElement('a');
    a.href = url;
	if(url.indexOf(a.hostname) !== -1){
    	return a.hostname;
	}else{
		return null;
	}
}


function setColor(tabID){
	var LS = localStorage['tabColors'+tabID];
	if(LS === "red"){
		chrome.browserAction.setIcon ( { path: '/icon/red(32).png' } );
	}else if(LS === "green"){
		chrome.browserAction.setIcon ( { path: '/icon/green(32).png' } );
	}else{
		chrome.browserAction.setIcon ( { path: '/icon/blue(32).png' } );
	}
}

function matchingDomainRegex(access_url, url_regex){
	var matching = false;
	if(access_url.length > 0 && url_regex.length > 0){
		if(url_regex.indexOf("http") === -1 && getHostFromURL("https://"+url_regex) === url_regex){ 
			/*checking host*/
			url_regex = url_regex.replace(".","\\.");
			url_regex = new RegExp("(http(s?))\:\/\/"+url_regex+"/.*","gi");
			//blocking host
			if(url_regex.test(access_url)){
				matching = true;
			}
		}else{
			/*checking url / url-regex */
			if(url_regex.indexOf("*") > -1){
				url_regex = url_regex.replace(/\*/g, '.*');
				url_regex = new RegExp(url_regex, "gi");
				if(url_regex.test(access_url)){
					matching = true;
				}
			}else{
				//blocking url
				if(access_url === url_regex){
					matching = true;
				}
			}
		}
	}
	return matching;
}

function isIP(ipaddress)   
{  
 if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))  
  {
	  return true;
  }else{
	  return false;	
  }
}

//----RECEIVE MESSAGES FROM UI 
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	if (request.type === "update"){
		updateLocalStorage();
	}else if(request.type === "refresh"){
		chrome.tabs.getSelected(null, function(tab) {
		  var code = 'window.setTimeout(function(){window.location.reload();},500);';
		  chrome.tabs.executeScript(tab.id, {code: code});
		});
	}
});

var validateIP = function(details) {
	var access_url = details.url;
	var stored_urls = localStorage.urls.split(",");
	//alert(stored_urls);
	var stored_ips = localStorage.allowed_ips;
	stored_ips = stored_ips.substring(0, stored_ips.length-1).split("|,");
	
	var shouldBlock = false;
	var isDomain = false;
	var domainIndex = -1;
	
	//check if access_url is one stored 
	for (var i = 0; i < stored_urls.length; i++) {
		var domain_matches = matchingDomainRegex(access_url, stored_urls[i]);
		if(domain_matches){
			isDomain = true;
			stored_ips = stored_ips[i].split(",");
		}
	}
	
	if(isDomain){
		var request = new XMLHttpRequest();
		request.open('GET', 'https://api.ipify.org', false);
		request.send(null);
		if (request.status === 200) {
			var user_ip = request.responseText;
			if(!isIP(user_ip)){
				alert("The tool used to get your public ip address did not return a valid IP address!\n\nValue returned: "+ user_ip+"\n\nPlease email max@maxis.me with the value returned. So sorry for the inconvenience!");
				shouldBlock = true;
			}
			
			for (var x = 0; x < stored_ips.length; x++) {
				var ip = stored_ips[x];
				var not = false;
				if(ip.charAt(0) === "!"){
					ip = ip.substring(1, ip.length);
					not = true;
				}
				
				if(user_ip === ip){
					shouldBlock = false;
				}else{
					shouldBlock = true;
				}
				
				if(not){
					shouldBlock = !shouldBlock;
				}
			}
		}else{
			alert("BLOCKED: The server used to get your public ip address is down");
			shouldBlock = true;
		}
	}
	
	var this_tab_id = localStorage.current_tab_id;
	
	if(shouldBlock){
		localStorage.setItem('tabColors'+this_tab_id, "red");
	}else{
		if(isDomain){
			localStorage.setItem('tabColors'+this_tab_id, "green");
		}else{
			localStorage.setItem('tabColors'+this_tab_id, "blue");
		}
	}
	setColor(this_tab_id);
	return {cancel: shouldBlock}
};

chrome.tabs.onActivated.addListener(function(info){
	localStorage.current_tab_id = info.tabId;
	setColor(info.tabId);
});

chrome.webRequest.onBeforeSendHeaders.addListener(
	validateIP,
	{ urls: ["<all_urls>"] },
	["blocking"]
);