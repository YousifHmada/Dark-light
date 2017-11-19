const express = require("express"),
	redisClient = require("./redis.js").redisClient;

const app = express();

const eventsListener = redisClient.createAnotherClient();

eventsListener.on('message', (channel, message)=>{
	console.log(message);
	let data = JSON.parse(message);
	
	/*
	    |--------------------------------------------------------------------------
	    | case 'one' : we will notify just one user
	    |--------------------------------------------------------------------------
	    |
	    | {
		|	 type:'one',
		|	 body:{
		|	 	senderId: <%some id%>,
		|	 	receiverId: <%some id%>
		|	 }
		| }	
		|
	*/
	if(data.type == 'one'){
		let senderId = data.body.senderId;
		let receiverId = data.body.receiverId;
		message = "user with id = " + senderId + " made some stuff!";
		redisClient.getUserConnection(receiverId)
			.then((socketId)=>{
				redisClient.publish('notifications_parsed', JSON.stringify({
					results : [socketId],
					message
				}));
			}).catch();
	}

	/*
	    |--------------------------------------------------------------------------
	    | case 'multiple' : we will notify multiple users
	    |--------------------------------------------------------------------------
	    |
	    | {
		|	 type:'multiple',
		|	 body:{
		|	 	senderId: <%some id%>,
		|	 	receiverIds: [
		|   		<%some id%>,
		|   		<%some id%>,
		|   		<%some id%>
		|   	]
		|	 }
		| }	
		|
	*/
	else if(data.type == 'multiple'){
		let senderId = data.body.senderId;
		let receiverIds = data.body.receiverIds;
		message = "user with id = " + senderId + " made some stuff!";
		receiverIds.forEach((receiverId)=>{
			redisClient.getUserConnection(receiverId)
			.then((socketId)=>{
				redisClient.publish('notifications_parsed', JSON.stringify({
					results : [socketId],
					message
				}));
			}).catch();
		});
	}
});

eventsListener.subscribe('parse_notifications');

app.listen('8080');