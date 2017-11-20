const express = require("express"),
	mongodb = require("./mongo.js").Mongodb,
	socketIO = require("socket.io"),
	redisClient = require("./redis.js").redisClient;


process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

const app = express();
app.use(express.static('public'));
const server = app.listen(3000);
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

app.get('/', (req, res)=>{
	mongodb.find('users',{})
	.then((results)=>{
		res.status(200).send({results})
	})
	.catch((err)=>{
		console.log(err.body);
		res.status(400).send(err.body)
	});
});


app.get('/:senderId/notify/one/:receiverId/:message', (req, res)=>{
	redisClient.publish('parse_notifications',JSON.stringify({
		type:'one',
		body:{
			senderId: req.params.senderId,
			receiverId: req.params.receiverId,
			message: req.params.message
		}
	}));
	res.send('done');
});

app.get('/:senderId/notify/all/:message', (req, res)=>{
	redisClient.publish('parse_notifications',JSON.stringify({
		type:'user-friends',
		body:{
			userId: req.params.senderId,
			message: req.params.message
		}
	}));
	res.send('done');
});

app.get('/:senderId/notify/some/:message', (req, res)=>{
	redisClient.publish('parse_notifications',JSON.stringify({
		type:'multiple',
		body:{
			senderId: req.params.senderId,
			receiverIds: [
				1,4,5
			],
			message: req.params.message
		}
	}));
	res.send('done');
});