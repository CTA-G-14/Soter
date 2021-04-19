"use strict";

function storeURL(domainOnly, whitelist){
	chrome.tabs.getSelected(null, function(tab) {
		var url = tab.url;
		if(domainOnly){
			url = getHostFromURL(tab.url);
		}
		
		var request = new XMLHttpRequest();
		request.open('GET', 'https://api.ipify.org', false);
		request.send(null);
		if (request.status === 200) {
			var ip = request.responseText;
			if(isIP){
				if(whitelist){
					storeWhitelist(url, ip, false, null);
				}else{
					storeWhitelist(url, "!"+ip, false, null);
				}
				
				
				chrome.runtime.sendMessage({type: "refresh"}, function(response) {
				  return true;
				});
			}else{
				alert("The tool used to get your public ip address did not return a valid IP address!\n\nValue returned: "+ ip+"\n\nPlease email max@maxis.me with the value returned. So sorry for the inconvenience!");
			}
		}else{
			alert("BLOCKED: The tool used to get your public ip address is down");
		}
	});
	
	setTimeout(function(){
		window.close();
	},1000);
	
}

function setUpPopup(){
	var xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
			var ip = xmlhttp.responseText;
			var ipClasses = document.getElementsByClassName("ip");
			for (var i = 0; i < ipClasses.length; i++) {
				ipClasses[i].innerHTML = ip;
			}
		}
	}
	xmlhttp.open("GET", 'https://api.ipify.org', false);
	xmlhttp.send();
}

document.getElementById("bl_domain").addEventListener("click", function(){
	storeURL(true, true);
}, false);

document.getElementById("wl_domain").addEventListener("click", function(){
	storeURL(true, false);
}, false);

document.getElementById("rules").addEventListener("click", function(){
	chrome.runtime.openOptionsPage();
}, false);


window.onload = function(){
	setUpPopup();
};