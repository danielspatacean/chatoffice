// angularjs
var app = angular.module('chatApp', []);
app.controller('ctrl', function ($scope) {

    $scope.currentLimit = 10;
    $scope.defaultCount = 100;
    $scope.messagesLimits = [];
    $scope.loading = false;

    loadMessageLimits($scope.defaultCount);

    $scope.updateProps = function () {
        $scope.props = onlineUsers;
    }

    $scope.updateTyping = function () {
        $scope.typing = typingUsers;
    }

    $scope.setLoading = function (value) {
        $scope.loading = value;
    }
    $scope.setLimit = function (count) {
        loadMessageLimits(count);
    }
    $scope.userIsDefined = function(){
        return ($("#name").val());
    }

    $scope.showMore = function (x) {
        if ($scope.loading || !$("#name").val()) {
            return;
        }

        $scope.loading = true;
        $scope.currentLimit = x;

        var myNode = document.getElementById("messages");
        while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
        }
        socket.emit('showlast', { limit: x, chatname: chatName.toLowerCase(), username: $("#name").val() });
    }

    function loadMessageLimits(count) {
        $scope.messagesLimits = [];
        if (count <= 100 && count > 10) {
            setMessagesLimits(count);
        }
        else if (count > 100) {
            setMessagesLimits($scope.defaultCount);
        }
        else {
            $scope.messagesLimits.push(10);
        }
    }

    function setMessagesLimits(count) {
        for (var i = 10; i <= count; i += 10) {
            $scope.messagesLimits.push(i);
        }
    }
});