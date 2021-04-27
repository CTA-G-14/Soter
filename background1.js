chrome.extension.onRequest.addListener(function(prediction){
    if (prediction==1){
        alert("Warning: Malicious website detected !!!");
        alert("***If you want to block click on extension icon***");
    }else if (prediction==-1){
        alert("Website is SAFE");
    }
});