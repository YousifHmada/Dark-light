/*
    |--------------------------------------------------------------------------
    | Mongodb Engine
    |--------------------------------------------------------------------------
    |
    | This module handles connections between this server and mongodb server
    | and exports all the methods used to connect to mongoserver as promises
    |
*/

const MongoClient = require("mongodb").MongoClient,
    assert = require("assert"),
    config = require("./config.js");

let Mongodb = {};

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
});

module.exports = {Mongodb};