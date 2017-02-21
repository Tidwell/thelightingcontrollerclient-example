// //import the client 
const LightingController = require('thelightingcontrollerclient');

var express = require('express');
var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
	let client;
	socket.on('connectLive', (config) => {
		client = new LightingController({
			ip: config.ip,
			password: config.password
		});

		client.onAny((event, data) => {
			socket.emit('liveEvent', {event: event, data: data});
		});

		client.connect();
	});

	socket.on('sendLive', (command) => {
		if (!client) { return; }
		client[command.command].apply(client, command.args);
	});
});

app.all("/*", function(req, res, next) {
    res.sendFile("index.html", { root: __dirname + "/public" });
});

server.listen(3000,  ()  => {
  console.log('TheLightingControllerClient Example App listening on port 3000!');
});
