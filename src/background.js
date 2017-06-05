/**
 * Created by Andrey Klochkov on 23.04.2015.
 */
Api.setBackgroundPage();

// messages
Api.addBackgroundListener(onMessageReceived);
Api.addAlarmListener('update-tracker', trackData);
Api.createAlarm('update-tracker', 60);

function trackData(){
    var bookStorage = new BookStorage();
    bookStorage.trackData();
}

function onMessageReceived(request, callback){
    callback = Helper.valueOrDefault(callback, function(){});

    if (request.type === "http-post-bg") {
        $.post(
            request.data.url,
            request.data.params,
            function(result){
                callback(result);
                return true;
            })
            .fail(function () {
                callback(undefined);
                return true;
            });
        return true;
    }

    if (request.type === "http-get-bg") {
        $.get(
            request.data.url,
            request.data.params,
            function(result){
                callback(result);
                return true;
            })
            .fail(function () {
                callback(undefined);
                return true;
            });
        return true;
    }

    if (request.type === "http-ajax-bg") {
        var contentType = Helper.valueOrDefault(request.data.contentType, undefined);
        var processData = Helper.valueOrDefault(request.data.processData, undefined);
        var dataType = Helper.valueOrDefault(request.data.dataType, undefined);
        var params = (request.typeParams != 'string') ? convertToFormData(request.data.params) : request.data.params;

        $.ajax({
            url: request.data.url,
            type: request.data.typeRequest,
            data: params,
            contentType: contentType,
            processData: processData,
            dataType: dataType
        })
            .done(function (result) {
                callback(result);
                return true;
            })
            .fail(function () {
                callback(undefined);
                return true;
            });

        return true;
    }

    return true;
}
