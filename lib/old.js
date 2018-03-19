
const app = {};

app.post('/messages', (req, res) => {
    checkForOnlineUsers();
    var message = new Message(req.body);

    // Using promises
    message.save().then(() => {
        httpIo.emit('message', req.body);
        httpsIo.emit('message', req.body);

        res.sendStatus(200);
    }).catch((err) => {
        // console.log(err);
        res.sendStatus(500);
    });


    message.save((err) => {
        if (err)
            res.sendStatus(500);

        httpIo.emit('message', req.body);
        httpsIo.emit('message', req.body);

        res.sendStatus(200);
    });


    // With async / await

    var savedMessage = await message.Save();

});


app.post('/onlineuser', (req, res) => {
    var person = req.body;
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

    res.sendStatus(200);
});