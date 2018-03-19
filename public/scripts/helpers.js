function urlify(text) {
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    return text.replace(urlRegex, function (url, b, c) {
        var url2 = (c == 'www.') ? 'http://' + url : url;
        return '<a href="' + url2 + '" target="_blank">' + url + '</a>';
    });
}

var isUriImage = function (uri) {
    //make sure we remove any nasty GET params 
    uri = uri.split('?')[0];
    //moving on now
    var parts = uri.split('.');
    var extension = parts[parts.length - 1];
    var imageTypes = ['jpg', 'jpeg', 'tiff', 'png', 'gif', 'bmp']
    if (imageTypes.indexOf(extension) !== -1) {
        return true;
    }
}

function postMessage(message) {
  socket.emit('message', message);
}

function getCurrentPerson(){
    var userName = $("#name").val();
    var cn = window.location.pathname.substring(1, window.location.pathname.length);
    if (userName != null && userName != undefined && userName) {
        var person = {
            name: userName,
            chatname: cn
        };
        return person;
    }
    return null;
}
