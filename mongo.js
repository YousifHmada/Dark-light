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
    appRootDir = require('app-root-dir').get(),
    assert = require("assert"),
    config = require(appRootDir + "/config.js");

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
            if(!ObjectId.isValid(id))return Promise.reject('id is invalid');
            let query = {_id: ObjectId(id), notificationsAllowed: true};
            return new Promise((resolve, reject)=>{
                db.collection(UsersCollection).findOne(query, (err, doc)=>{
                    if(err != null)console.log(err),resolve(false);
                    if(doc == null)resolve(false);
                    resolve(true);
                });
            });
    };

    Mongodb.user.getFriends = (id)=>{
        if(!ObjectId.isValid(id))return Promise.reject('id is invalid');
        let query = {_id: ObjectId(id)};
        let projection = {_id:0, friends:1};
        return new Promise((resolve, reject)=>{
            db.collection(UsersCollection).findOne(query, projection, (err, doc)=>{
                if(err != null)console.log(err),resolve(false);
                if(doc.friends == null)resolve({friends: []});
                resolve(doc);
            });
        });
    };

});

module.exports = {Mongodb};