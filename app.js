const express = require("express"),
	Mongodb = require("./mongo.js").Mongodb;

const app = express();


app.get('/', (req, res)=>{
	Mongodb.find('users',{})
	.then((results)=>{
		res.status(200).send({results})
	})
	.catch((err)=>{
		console.log(err);
		res.status(400).send('error occured')
	});
});

app.listen(3000);