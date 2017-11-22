const express = require("express"),
	router = new express.Router(),
	appRootDir = require('app-root-dir').get(),
	mongodb = require(appRootDir + "/mongo.js").Mongodb,
	redisClient = require(appRootDir + "/redis.js").redisClient;

router.get('/movie', (req, res)=>{
	res.send('index.html');
});

router.get('/', (req, res)=>{
	mongodb.find('users',{})
	.then((results)=>{
		res.status(200).send({results})
	})
	.catch((err)=>{
		console.log(err.body);
		res.status(400).send(err.body)
	});
});


router.get('/:senderId/notify/one/:receiverId/:message', (req, res)=>{
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

router.get('/:senderId/notify/all/:message', (req, res)=>{
	redisClient.publish('parse_notifications',JSON.stringify({
		type:'user-friends',
		body:{
			userId: req.params.senderId,
			message: req.params.message
		}
	}));
	res.send('done');
});

router.get('/:senderId/notify/some/:message', (req, res)=>{
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

module.exports = router;