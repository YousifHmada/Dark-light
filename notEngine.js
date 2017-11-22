const express = require("express"),
	mongodb = require("./mongo.js").Mongodb,
	redisClient = require("./redis.js").redisClient;

require('app-root-dir').set(__dirname);

const app = express();

const eventsListener = redisClient.createAnotherClient();

eventsListener.on('message', (channel, message)=>{
	console.log(message);
	let data = JSON.parse(message);
	/*
	    |--------------------------------------------------------------------------
	    | case 'user-sub-friends' : we will notify all the subscribed friends
	    |--------------------------------------------------------------------------
	    |
	    | {
		|	 type:'user-sub-friends',
		|	 body:{
		|    	userId: <%some id%>
		|		message: <%some message%>
		|	 }
		| }	
		|
		|--------------------------------------------------------------------------
	    | case 'user-friends' : we will notify all the user's friends
	    |--------------------------------------------------------------------------
	    |
		| including unsubscribed friends
		|
	    | {
		|	 type:'user-friends',
		|	 body:{
		|    	userId: <%some id%>,
		|		message: <%some message%>
		|	 }
		| }	
		|
	*/
	if(data.type == 'user-sub-friends' || data.type == 'user-friends'){
		message = data.body.message;
		mongodb.user.getFriends(data.body.userId)
			.then((Friendsdata)=>{
				let receiverIds = Friendsdata.friends;
				return Promise.all(receiverIds.map((receiverId)=>{
					return redisClient.getUserConnection(receiverId);
				}))
				.then((dataArray)=>{
					return dataArray.filter((socketId)=>{
						if(socketId != null)return true;
					});
				}).then((results)=>{
					if(results.length == 0)return;
					redisClient.publish('notifications_parsed', JSON.stringify({
						results : results,
						message,
						important: (data.type == 'user-friends') ? true : false
					}));
				});
			})
			.catch(err=>console.log('error', err.body))
	}


	/*
	    |--------------------------------------------------------------------------
	    | case 'one' : we will notify just one user
	    |--------------------------------------------------------------------------
	    |
	    | {
		|	 type:'one',
		|	 body:{
		|	 	senderId: <%some id%>,
		|	 	receiverId: <%some id%>,
		|		message: <%some message%>
		|	 }
		| }	
		|
	*/
	if(data.type == 'one'){
		let senderId = data.body.senderId;
		let receiverId = data.body.receiverId;
		message = data.body.message;
		redisClient.getUserConnection(receiverId)
			.then((socketId)=>{
				if(socketId != null){
					redisClient.publish('notifications_parsed', JSON.stringify({
						results : [socketId],
						message,
						important: true
					}));
				}
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
		|   	],
		|	    message: <%some message%>
		|	 }
		| }	
		|
	*/
	else if(data.type == 'multiple'){
		let senderId = data.body.senderId;
		let receiverIds = data.body.receiverIds;
		message = data.body.message;
		Promise.all(receiverIds.map((receiverId)=>{
			return redisClient.getUserConnection(receiverId);
		}))
		.then((dataArray)=>{
			return dataArray.filter((socketId)=>{
				if(socketId != null)return true;
			});
		}).then((results)=>{
			redisClient.publish('notifications_parsed', JSON.stringify({
				results : results,
				message,
				important: true
			}));
		}).catch();
	}
});

eventsListener.subscribe('parse_notifications');

app.listen('8080');