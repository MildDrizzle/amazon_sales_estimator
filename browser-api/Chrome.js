/**
 * Created by Andrey Klochkov on 08.06.2015.
 */

/**
 * chrome browser API wrapper class
 */
function Api(){
}

Api.browser = 'Chrome';
Api.messageListener = function(message, callback){};
Api.backgroundMessageListener = function(message, callback){};

/**
 * Add message listener
 * @param messageListener
 */
Api.addListener = function(messageListener){
    Api.messageListener = messageListener;
    chrome.runtime.onMessage.addListener(function(request, sender, callback){
        return messageListener(request, callback);
    });
};

/**
 * Add background message listener
 * @param backgroundMessageListener
 */
Api.addBackgroundListener = function(backgroundMessageListener){
    Api.backgroundMessageListener = backgroundMessageListener;

    chrome.runtime.onMessage.addListener(function(request, sender, callback){
        //if (request.sendBack) {
        //    chrome.tabs.sendMessage(sender.tab.id, request);
        //}
        return backgroundMessageListener(request, callback);
    });
};

Api.sentFromPageScript = function(){
    return typeof chrome.tabs === 'undefined';
};

/**
 * Send a message to the active tab
 * @param message
 * @param callback
 */
Api.sendMessageToActiveTab = function(message, callback){
    if (typeof callback === 'undefined') callback = function(){};
    if (Api.sentFromPageScript()){
        Api.messageListener(message, function(result){
            return callback(result);
        });
        return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            if (typeof callback !== 'undefined' && typeof(callback) === 'function')
                return callback(response);
        });
    });
};

/**
 * Send a message to background
 * @param message
 * @param callback
 */
Api.sendMessageToBackground = function(message, callback){
    if (typeof callback === 'undefined') callback = function(){};
    chrome.runtime.sendMessage(message, callback);
};

Api.setBackgroundPage = function(){
    // We don't need this for Chrome
};

Api.openNewTab = function(url){
    chrome.tabs.create({url: url});
};

Api.registerOnShowEvent = function(eventListener){
    // just call it once because Chrome constructs the popup on every show
    setTimeout(eventListener, 0);
};

Api.storage = chrome.storage.local;

Api.addAlarmListener = function(alarmName, listener){
    chrome.alarms.onAlarm.addListener(function(alarm) {
        if(alarm.name === alarmName){
            listener();
        }
    });
};

Api.createAlarm = function(alarmName, periodInMinutes){
    chrome.alarms.create(alarmName, {delayInMinutes: periodInMinutes, periodInMinutes: periodInMinutes});
};

Api.getImageDataFromUrl = function(url, callback){
    callback(url);
};

// polyfills for ECMAScript 6
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}
