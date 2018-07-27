var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = 3000;

var chats = [];

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    socket.on('SEND_MESSAGE', function (payload) {
        console.log('NEW MESSAGE!!!!! ', payload);
        io.emit('MESSAGE', payload);
    });

    socket.on('GET_CHATS', function () {
        console.log('GET_CHATS. Len: ', chats.length);

        io.emit('CHATS', chats);
    });

    socket.on('createChat', function () {
        chats.push(socket.id);
        var chatName = 'ROOM ' + socket.id;
        console.log('Chat ' + chatName + ' created');

        socket.join(chatName);
        // sending new chat list to host
        io.emit('CHATS', chats);
    });

    socket.on('joinChat', function (chatName) {
        console.log('ADMIN joined ' + chatName);
        socket.join(chatName);
        io.to(chatName.replace('ROOM ', '')).emit('MESSAGE', { who: 'host', text: 'Hello, lets chat!' });
    });

    socket.on('disconnect', function () {
        console.log('USER ' + socket.id + ' disconnected');

        var index = chats.indexOf(socket.id);
        if (index !== -1) {
            chats.splice(index, 1);
        }

        io.emit('CHATS', chats);
    });
});

server.listen(port, function () {
    console.log('Listening on port', port);
});
