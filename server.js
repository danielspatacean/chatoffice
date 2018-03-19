// load dependencies
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const _ = require('underscore');
const io = require('socket.io');
const mongoose = require('mongoose');
// http & https modules
const https = require('https');
const http = require('http');

// force ssl library
const forceSsl = require('express-force-ssl');

// load appSettings
const appSettings = require('./appsettings');

const databaseModel = appSettings.development ? 'Message-Dev' : 'Message';
// Set a database model
var Message = mongoose.model(databaseModel, {
    name: String,
    message: String,
    chatname: String,
    date: Date
});
// Connect to MongoDB
mongoose.connect(process.env.CHAT_DB_URL, (err) => {
    if (err) {
        throw err;
    }
});

// create the express app
const app = express();

// create http server
const httpServer = http.createServer(app);

// load ssl certificates
var key = fs.readFileSync('./ssl/private.key');
var cert = fs.readFileSync('./ssl/certificate.crt');
var ca = fs.readFileSync('./ssl/ca.crt');

var options = {
    key: key,
    cert: cert,
    ca: ca,
    requestCert: false,
    rejectUnauthorized: false
};

// create https server
const httpsServer = https.createServer(options, app);

// create the webSockets for both servers (http & https)
const httpIo = io.listen(http);
const httpsIo = io.listen(httpsServer);

// express settings
app.use(express.static('./public')); // use static content - html files
app.use(bodyParser.json()); // we expect json to coming in, with our http requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(forceSsl);

var onlineUsers = [];
var typingUsers = [];

function checkForOnlineUsers() {
    onlineUsers = [];
    httpsIo.emit('onlinecheck');
    httpIo.emit('onlinecheck');
}

function checkForTypingUsers(data) {
    var person = data;
    if (person.name) {
        if (person.typing === true) {
            var newArray = _.filter(typingUsers, function (p) {
                return p.name.toLowerCase() === person.name.toLowerCase() &&
                    p.chatname.toLowerCase() === person.chatname.toLowerCase()
            });
            if (newArray.length < 1) {
                typingUsers.push(person);
            }
        }
        else {
            var index = typingUsers.findIndex(e => e.name.toLowerCase() === person.name.toLowerCase() &&
                e.chatname.toLowerCase() === person.chatname.toLowerCase());
            typingUsers.splice(index, 1);
        }
    }

    httpsIo.emit('typing', typingUsers);
    httpIo.emit('typing', typingUsers);
}

function getAllMessages(chatName, userName) {
    Message.find({ chatname: chatName })
        .sort({ date: -1 })
        .exec(function (err, messages) {
            var result = {username: userName, messages: messages};
            httpsIo.emit('messages', result);
            httpIo.emit('messages', result);
        });
}

function getLimitedMessages(chatName, limit, userName) {
    Message.find({ chatname: chatName })
        .sort({ date: -1 }).limit(limit)
        .exec(function (err, messages) {
           
            var result = {username: userName, messages: messages};
            httpsIo.emit('messages', result);
            httpIo.emit('messages', result);
        });
}

setInterval(checkForOnlineUsers, 10000);

function showLastMessages(limit, chatName, userName) {
    if (limit === -1) {
        getAllMessages(chatName, userName);
    }
    else {
        getLimitedMessages(chatName, limit, userName);
    }
}

httpIo.on('connection', (socket) => {
    setSocketHandlers(socket);
});

httpsIo.on('connection', (socket) => {
   setSocketHandlers(socket);
});

function setSocketHandlers(socket){
    checkForOnlineUsers();
    socket.on('typing', (data) => {
        checkForTypingUsers(data);
    });

    socket.on('onlineuser', (person) => {
        if (person.name) {
            var newArray = _.filter(onlineUsers, function (p) {
                return p.name.toLowerCase() === person.name.toLowerCase() &&
                    p.chatname.toLowerCase() === person.chatname.toLowerCase()
            });
            if (newArray.length < 1) {
                onlineUsers.push(person);
            }
        }

        httpsIo.emit('onlineusers', onlineUsers);
        httpIo.emit('onlineusers', onlineUsers);
    });

    socket.on('message', (msg) => {
        checkForOnlineUsers();
        var message = new Message(msg);

        // Using promises
        message.save().then(() => {
            httpIo.emit('message', message);
            httpsIo.emit('message', message);

        }).catch((err) => {
            // console.log(err);
        });
    });

    socket.on('showlast', (options) => {
        showLastMessages(options.limit, options.chatname, options.username);
    });
}

// ---------------------- Handle Requests -------------------- //

// Particular get
app.get('/.well-known/acme-challenge/f4n3VW0OTOd80QQgmoED3bU2R41caPs_fb57vVlyOi0', (req, res) => {
    res.sendFile(path.join(__dirname, './.well-known/acme-challenge/f4n3VW0OTOd80QQgmoED3bU2R41caPs_fb57vVlyOi0'));
});

app.get('/typing', (req, res) => {
    res.send(typingUsers);
});

//just 2 delete test data
app.get('/cleartest', (req, res) => {
    Message.deleteMany({ chatname: 'testulet' }).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        res.sendStatus(500);
    });
});

// GET messages
app.get('/messages', async (req, res) => {
    var chatName = req.url.substring(15, req.url.length).toLowerCase();

    var d = new Date();
    d.setDate(d.getDate() - 2);

    var count = await Message.count({ chatname: chatName });

    Message.find({
        chatname: chatName
    })
        .sort({ 'date': -1 })
        .limit(10)
        .exec(function (err, messages) {
            res.send({ count: count, messages: messages });
        });
});

// Clear database
app.get('/admin_page_clear_chat', (req, res) => {
    // Using promises
    Message.deleteMany({}).then(() => {
        res.sendStatus(200);
    }).catch((err) => {
        res.sendStatus(500);
    });
});

// Generic get, regex - Match anything
app.get('/:type(*)', (req, res) => {
    var chatName = req.url.substring(1, req.url.length);
    res.sendFile(path.join(__dirname, '/public/chat.html'));
});

app.post('/leave', (req, res) => {
    onlineUsers = onlineUsers.filter(function (obj) {
        return obj.username !== req.body.username && obj.chatname !== req.body.chatname;
    });
    checkForOnlineUsers();
    res.sendStatus(200);
});

// http server listen
httpServer.listen(appSettings.httpPort, () => {
    // callback function
    //  console.log('server is listening on port ' + httpServer.address().port);
});

// https server listen
httpsServer.listen(appSettings.httpsPort, () => {
    //   console.log('https listen on port ' + httpsServer.address().port);
});