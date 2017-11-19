/*
    |--------------------------------------------------------------------------
    | Redis Server
    |--------------------------------------------------------------------------
    |
    | This module handles connection among server, notifications engine 
    | and redis database
    |
*/

const redis = require("redis"),
	config = require("./config.js");

redisClient = redis.createClient(config.redis.port, config.redis.host);

/*
    |--------------------------------------------------------------------------
    | user related methods
    |--------------------------------------------------------------------------
*/

redisClient.createAnotherClient = ()=>{
	return redis.createClient(config.redis.port, config.redis.host);
}

redisClient.getUserConnection = (userId)=>{
	return new Promise((resolve, reject)=>{
		redisClient.hget('users:connections', userId, function(err, data){
			if(err != null)reject(err);
			resolve(data);
		})
	});
}

redisClient.saveUserConnection = (userId, socketId)=>{
	return new Promise((resolve, reject)=>{
		redisClient.hset('users:connections', userId, socketId, function(err, data){
			if(err != null)reject(err);
			resolve(data);
		})
	});
}

redisClient.deleteUserConnection = (userId)=>{
	return new Promise((resolve, reject)=>{
		redisClient.hdel('users:connections', userId, function(err, data){
			if(err != null)reject(err);
			resolve(data);
		})
	});
}


module.exports = {
	redisClient
}