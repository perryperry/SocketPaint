var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = {};

server.listen(3000);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

	socket.on('new user', function(data, callback) {
		if(data in users) {
			console.log("Denying " + data + "access to the chat");
			callback(false);
		} else {
			console.log("Adding " + data + " to the chat");
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}

	});

	// receive socket's message
	socket.on('send-message', function(data, callback){
		console.log(data);
		var msg = data.trim();
		// check if private message, protol is @username
		if(msg.substr(0,1) === '@'){
			msg = msg.substr(1);
			var ind = msg.indexOf(' ');
			if(ind != -1) {
				// check if user name is valid
				var name = msg.substring(0,ind);
				var msg = msg.substring(ind + 1);
				if(name in users) 
				{
					users[name].emit('private-message', {msg: data, nick: socket.nickname});
					console.log('private message');	
				} else {
					callback("Error: private message requires valid @username")
				}
				
			} else {
				callback('Error: include a message');
			}
		} else {
			// sends to everyone, including this client
			io.sockets.emit('new-message', {msg: data, nick: socket.nickname});
			// would send to everyone else, except this client
			// socket.broadcast.emit('new-message', data);
		}
 
	});

	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});

	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}
});














// var http = require('http');
// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/plain'});
//   res.end('Hello World\n');
// }).listen(8124, "127.0.0.1");
// console.log('Server running at http://127.0.0.1:8124/');