const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	}
});

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
	console.log('a user connected');
	socket.on('desc', (msg) => {
		console.log('on desc: ' + msg);
		socket.broadcast.emit('desc', msg);
	});

	socket.on('web_desc', (msg) => {
		console.log('on web_desc: ' + msg);
		socket.broadcast.emit('web_desc', msg);
	});

	socket.on('server_desc', (msg) => {
		console.log('on server_desc: ' + msg);
		socket.broadcast.emit('server_desc', msg);
	});

	socket.on('ice', (msg) => {
		console.log('on ice: ' + msg);
		socket.broadcast.emit('ice', msg);
	});

	socket.on('test', (msg, ack) => {
		console.log('test: ' + msg);
		ack('my ack');
	});
});

server.listen(7777, () => {
	console.log('listening on *:7777');
});
