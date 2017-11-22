const express = require("express"),
	mongodb = require("./mongo.js").Mongodb,
	socketIO = require("socket.io"),
	redisClient = require("./redis.js").redisClient,
	hbs = require("hbs");

/*seeting the absoule app-root-dir*/
require('app-root-dir').set(__dirname);

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

const app = express();

/*setting up the templating engine*/
hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine', 'hbs');

/*setting up the public folder*/
app.use(express.static('public'));

/*setting up the server*/
const server = app.listen(3000);

/*organizing the sockets*/
io = socketIO(server);

const sockets = [];

const eventsListener = redisClient.createAnotherClient();

eventsListener.on('message', (channel, message)=>{
	if(channel == 'notifications_parsed')
	{
		console.timeEnd('notEngineRespond');
		console.time('emitRespond');
		let results = JSON.parse(message);
		message = results.message;
		important = results.important;
		results = results.results;
		results.forEach((socketId)=>{
			console.log(message);
			if(sockets[socketId] != null){
				if(important)return sockets[socketId].emit('notifications', message);
				if(sockets[socketId].appUser.isNotificationsAllowed)sockets[socketId].emit('notifications', message);
			}
		});
		console.timeEnd('emitRespond');
		console.timeEnd('totalRespond');
	}
});

eventsListener.subscribe('notifications_parsed');


io.on('connection',(socket)=>{
	//console.log('some one' + ' connected');
	socket.on('connection', (id)=>{
		console.time('totalRespond');
		sockets[socket.id] = socket;
		socket.appUser= {};
		socket.appUser.id = id;
		socket.appUser.isNotificationsAllowed = false;
		console.log(socket.appUser.id + ' connected');
		redisClient.saveUserConnection(id, socket.id);
		socket.emit('connection', socket.id);
		console.time('notEngineRespond');
		redisClient.publish('parse_notifications',JSON.stringify({
			type:'user-sub-friends', 
			body:{
				userId: id,
				message: id + ' is connected now'
			}
		}));
		mongodb.user.isNotificationsAllowed(id)
			.then((isAllowed)=>{
				socket.appUser.isNotificationsAllowed = isAllowed;
			})
			.catch(err=>console.log(err.body));
	});
	socket.on('disconnect',()=>{
		if(socket.appUser != null && socket.appUser.id != null){
			console.log(socket.appUser.id  + ' disconnected');
			redisClient.deleteUserConnection(socket.appUser.id);
			redisClient.publish('parse_notifications',JSON.stringify({
			type:'user-sub-friends', 
				body:{
					userId: socket.appUser.id,
					message: socket.appUser.id + ' has disconnected '
				}
			}));
		}
	});
});

app.use((req, res, next)=>{
	console.time('totalRespond');
	console.time('userRespond');
	next();
});

app.use('/', require('./router/app_routes.js'))