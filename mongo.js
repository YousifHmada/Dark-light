/*
    |--------------------------------------------------------------------------
    | Mongodb Server
    |--------------------------------------------------------------------------
    |
    | This module handles connections between this server and mongodb server
    | and exports all the methods used to connect to mongoserver as promises
    |
*/

const MongoDriver = require("mongodb"),
    MongoClient = MongoDriver.MongoClient,
    ObjectId = MongoDriver.ObjectId,
    assert = require("assert"),
    config = require("./config.js");

let Mongodb = {};
let UsersCollection = "users";

//establising connection
MongoClient.connect(config.mongodb.url, function(err, db) {

    assert.equal(err, null);

    /*
        |--------------------------------------------------------------------------
        | General useage methods
        |--------------------------------------------------------------------------
    */
    Mongodb.find = (collection, query)=>{
            return new Promise((resolve, reject)=>{
                var cursor = db.collection(collection).find(query)
                .toArray((err, docs)=>{
                    if(err != null)reject(err);
                    resolve(docs);
                });
            });
    };

    /*
        |--------------------------------------------------------------------------
        | user related methods
        |--------------------------------------------------------------------------
    */
    Mongodb.user = {};

    Mongodb.user.isNotificationsAllowed = (id)=>{
            let query = {_id: ObjectId(id), notificationsAllowed: true}
            return new Promise((resolve, reject)=>{
                var cursor = db.collection(UsersCollection).findOne(query, (err, doc)=>{
                    if(err != null)console.log(err),resolve(false);
                    if(doc == null)resolve(false);
                    resolve(true);
                });
            });
    };
});

module.exports = {Mongodb};