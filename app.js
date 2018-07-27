var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

var chats = [];

// TODO: redesign Room constructor
function Room(name, client) {
    this.name = name;
    this.client = client;
}

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// function returns chat Room by chatter's socket.id
function getRoomByGuest(guest) {
    console.log('AVAILABLE CHATS: ', chats);

    for (let i = 0, len = chats.length; i < len; i++) {
        console.log('Im in for function, name: ' + chats[i].name + ', client: ' + chats[i].client);
        if (chats[i].client === guest || chats[i].host === guest) {
            return chats[i];
        }
    }
    return undefined;
}

io.on('connection', function (socket) {

    socket.on('SEND_MESSAGE', function (payload) {
        let foundRoom = getRoomByGuest(socket.id);
        console.log('New message: ' + payload.text + ', FROM: ' + socket.id + ', will be sent to room name: ' + foundRoom.name);
        io.to(foundRoom.name).emit('MESSAGE', payload);
    });

    socket.on('GET_CHATS', function () {
        io.emit('CHATS', chats);
    });

    socket.on('createChat', function () {
        var chatName = 'ROOM ' + socket.id;
        chats.push(new Room(chatName, socket.id));
        console.log('Chat ' + chatName + ' created');

        socket.join(chatName);
        // sending new chat list to host
        io.emit('CHATS', chats);
    });

    socket.on('joinChat', function (chatName) {
        console.log('ADMIN joined ' + chatName);
        socket.join(chatName);
        let clientId = chatName.replace('ROOM ', '');
        let foundRoom = getRoomByGuest(clientId);
        if (foundRoom) {
            foundRoom.host = socket.id;
            io.to(clientId).emit('MESSAGE', { who: 'host', text: 'Hello, lets chat!' });
        }
    });

    socket.on('disconnect', function () {
        console.log('USER ' + socket.id + ' disconnected');
        // removing room when client disconnected
        chats = chats.filter(el => el.client !== socket.id || el.host !== socket.id);

        io.emit('CHATS', chats);
        // TODO: Inform other guy, that user was disconnected from the room
    });
});

server.listen(port, function () {
    console.log('Listening on port', port);
});
