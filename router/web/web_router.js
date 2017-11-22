const express = require("express"),
	router = new express.Router(),
	appRootDir = require('app-root-dir').get(),
	mongodb = require(appRootDir + "/mongo.js").Mongodb,
	redisClient = require(appRootDir + "/redis.js").redisClient;

router.get('/movie', (req, res)=>{
	res.render('movie_template',{
		people: [1,2,3,4,5]
	});
});

module.exports = router;