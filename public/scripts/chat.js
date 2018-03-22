var onlineUsers = [];
var chatName;
var scope;


$(document).ready(function () {
    scope = angular.element(document.getElementById('controllerDiv')).scope();
    // set name by cookie
    emojify.setConfig({ tag_type: 'p' });
    var name = readCookie("name");

    if (name != "null") {
        $("#name").val(name);
    }
    chatName = window.location.pathname.substring(1, window.location.pathname.length);

    document.getElementById('chatName').innerHTML = (chatName + ' ' + 'Chat');

    $("#send").click(function () {
        var message = {
            name: $("#name").val().trim(),
            message: $("#message").val().trim(),
            date: new Date(),
            chatname: chatName.toLowerCase()
        };
        if (!message.name || !message.message) {
            alert('Name + Message are required.');
            return;
        }
        createCookie('name', message.name, 0.16);
        postMessage(message);
        $("#message").val('');


        var userName = $("#name").val();
        var cn = window.location.pathname.substring(1, window.location.pathname.length);
        if (userName != null && userName != undefined && userName) {
            var person = {
                name: userName,
                chatname: cn,
                typing: false
            };
            socket.emit('typing', person);
        }
    });
    getMessages();
});

// dots animation
window.setInterval(function () {
    var wait = document.getElementById("wait");
    if (wait.innerHTML.length > 3)
        wait.innerHTML = "";
    else
        wait.innerHTML += ".";
}, 300);

$("#message").on("keypress", function (e) {
    /* ENTER PRESSED*/
    if (e.keyCode == 13) {
        e.preventDefault();
        $("#send").click();
    }
});

var socket = io();

socket.on('onlinecheck', function () {
    var userName = $("#name").val();
    var cn = window.location.pathname.substring(1, window.location.pathname.length);
    if (userName != null && userName != undefined && userName) {
        var person = {
            name: userName,
            chatname: cn
        };
        socket.emit('onlineuser', person);
    }
});

socket.on('onlineusers', function (users) {
    // var chatName = window.location.pathname.substring(1, window.location.pathname.length);
    var onlineUsersForThisChat = [];
    users.forEach(function (user) {
        if (user.chatname.toLowerCase() === chatName.toLowerCase())
            onlineUsersForThisChat.push(user.name);
    });
    setProps(onlineUsersForThisChat);
});

function setProps(users) {
    onlineUsers = users.slice();
    onlineUsers.sort(function (a, b) {
        return a.localeCompare(b);
    });
    // angular.element('#hidden').triggerHandler('click');
    scope = angular.element(document.getElementById('controllerDiv')).scope();
    scope.$apply(function () {
        scope.updateProps();
    });
}

socket.on('messages', function (result) {
    scope = angular.element(document.getElementById('controllerDiv')).scope();

    if (result.username === $("#name").val()){
        result.messages.filter(function(elem){
            return elem.chatname.toLowerCase() == chatName.toLowerCase();
        }).reverse().forEach(addMessage);
    
        scope.$apply(function () {
            scope.setLoading(false);
        });
    
        updateScroll();
    }
    else{
        scope.$apply(function () {
            scope.setLoading(false);
        });
    }
    
});

socket.on('message', function (message) {
    if (chatName.toLowerCase() === message.chatname.toLowerCase()) {
        addMessage(message);

        updateScroll();
        if (message.name.trim() != $("#name").val()) {
            var notificationTitle = 'New message on ' + chatName;
            Push.create(notificationTitle, {
                body: message.name + ": " + message.message,
                icon: '/img/msg2.gif',
                timeout: 4000,
                onClick: function () {
                    window.focus();
                    this.close();
                }
            });
            if (chatName.toLowerCase() === "swfactory"){
                if (message.message.toLowerCase().includes('spariet')) {
                    playAudio('/sound/funny/spariet.mp3');
                }
                else if (message.message.toLowerCase().includes('haha')) {
                    if (new Date().getDay() === 5) {
                        playAudio('/sound/funny/haha2.mp3');
                    }
                    else {
                        playAudio('/sound/funny/haha.mp3');
                    }
                }
                else if (message.message.toLowerCase().includes(':))') || message.message.toLowerCase().includes('=))')) {
                    playAudio('/sound/funny/haha.mp3')
                }
                else if (message.message.toLowerCase().includes('friday')) {
                    playAudio('/sound/funny/do-the-friday.mp3');
                }
                else if (message.message.toLowerCase().includes('see you on monday')) {
                    playAudio('/sound/funny/see-you-monday.mp3');
                }
                else if (message.message.toLowerCase().includes('go home early')) {
                    playAudio('/sound/funny/go-home-early.mp3');
                }
                else if (message.message.toLowerCase().includes('lala')) {
                    playAudio('/sound/funny/lala.mp3');
                }
                else {
                    playAudio('/sound/notification.mp3');
                }
            }
            else{
                playAudio('/sound/notification.mp3');
            }
        }
    }
});

function playAudio(file) {
    var audio = new Audio(file);
    audio.play();
}

function getMessages() {
    var path = window.location.pathname.substring(1, window.location.pathname.length);
    $.get('/messages?chat=' + path, function (data) {
        scope.$apply(function () {
            scope.setLimit(data.count);
        });
        data.messages.reverse().forEach(addMessage);
        updateScroll();
    });
}

function updateScroll() {
    var element = document.getElementById("messagesContainer");
    element.scrollTop = element.scrollHeight;
}

function addMessage(message) {
    var urlFiedMessage = urlify(message.message);
    var img = '';
    if (isUriImage(message.message)) {
        img = "<p class='center'><img src='" + message.message + "' style='max-width: 500px; max-height: 800px'></p>";
    }

    $("#messages").append(
        '<div class="message darker">' +
        '<h4 class="username">' + message.name + '</h4>' +
        '<p class="message-content" style="margin-left:15px; word-break: break-all">' + urlFiedMessage + '</p>' +
        img +
        '<span class="time-left">' + message.date.substring(0, 21) + '</span>' + '</div>');
    emojify.run();
}

// who is typing feature

var timeout;
var typingUsers = [];

function timeoutFunction() {
    var userName = $("#name").val();
    var cn = window.location.pathname.substring(1, window.location.pathname.length);
    if (userName != null && userName != undefined && userName) {
        var person = {
            name: userName,
            chatname: cn,
            typing: false
        };
        socket.emit('typing', person);
    }
}

$('#message').keyup(function (e) {
    var code = e.which;
    if (code === 13) {
        return;
    }
    var userName = $("#name").val();
    var cn = window.location.pathname.substring(1, window.location.pathname.length);
    var message = $("#message").val();
    if (userName != null && userName != undefined && userName) {
        if (message) {
            var person = {
                name: userName,
                chatname: cn,
                typing: true
            };
            socket.emit('typing', person);
            clearTimeout(timeout);
            timeout = setTimeout(timeoutFunction, 2000);
        }
        else {
            var person = {
                name: userName,
                chatname: cn,
                typing: false
            };
            socket.emit('typing', person);
            clearTimeout(timeout);
            timeout = setTimeout(timeoutFunction, 2000);
        }
    }
});

socket.on('typing', function (data) {
    var result = data.filter(function (event) {
        return event.chatname.toLowerCase() === chatName.toLowerCase();
    }).map(function (u) {
        return u.name;
    });
    typingUsers = result;
    //angular.element('#hiddenT').triggerHandler('click');
    scope = angular.element(document.getElementById('controllerDiv')).scope();
    scope.$apply(function () {
        scope.updateTyping();
    });
});
