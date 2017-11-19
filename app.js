const express = require("express"),
	mongodb = require("./mongo.js").Mongodb,
	socketIO = require("socket.io"),
	redisClient = require("./redis.js").redisClient;

const app = express();
app.use(express.static('public'));
const server = app.listen(3000);
io = socketIO(server);

const sockets = [];

const eventsListener = redisClient.createAnotherClient();

eventsListener.on('message', (channel, message)=>{
	if(channel == 'notifications_parsed')
	{
		console.log(message);
		let results = JSON.parse(message);
		message = results.message;
		results = results.results;
		results.forEach((socketId)=>{
			sockets[socketId].emit('notifications', message);
		});
	}
});

eventsListener.subscribe('notifications_parsed');


io.on('connection',(socket)=>{
	//console.log('some one' + ' connected');
	socket.on('connection', (id)=>{
		sockets[socket.id] = socket;
		socket.appUser= {};
		socket.appUser.id = id;
		socket.appUser.isNotificationsAllowed = false;
		//console.log(socket.appUserId + ' connected');
		redisClient.saveUserConnection(id, socket.id,);
		socket.emit('connection', socket.id);
		redisClient.publish('parse_notifications',JSON.stringify({socket: socket.id,id: id}));
		mongodb.user.isNotificationsAllowed(id)
			.then((isAllowed)=>{
				socket.appUser.isNotificationsAllowed = isAllowed;
			})
			.catch(err=>console.log(err));
	});
	socket.on('disconnect',()=>{
		if(socket.appUserId != null){
			//console.log(socket.appUserId + ' disconnected');
			redisClient.deleteUserConnection(socket.appUser.id);
		}
	});
});


app.get('/', (req, res)=>{
	mongodb.find('users',{})
	.then((results)=>{
		res.status(200).send({results})
	})
	.catch((err)=>{
		console.log(err);
		res.status(400).send('error occured')
	});
});

// app.get('/:senderId/notify/:receiverId', (req, res)=>{
// 	redisClient.publish('parse_notifications',JSON.stringify({
// 		type:'one',
// 		body:{
// 			senderId: req.params.senderId,
// 			receiverId: req.params.receiverId
// 		}
// 	}));
// 	res.send('done');
// });

// app.get('/:senderId/notify', (req, res)=>{
// 	redisClient.publish('parse_notifications',JSON.stringify({
// 		type:'multiple',
// 		body:{
// 			senderId: req.params.senderId,
// 			receiverIds: [
// 				1,4,5
// 			]
// 		}
// 	}));
// 	res.send('done');
// });