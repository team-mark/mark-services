"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo = require("mongodb");
const debug = require('debug')('mark:db');
let db;
let client;
function getInstance() {
    if (db) {
        return Promise.resolve(db);
    }
    else {
        return setupConnection()
            .then(_db => {
            db = _db;
            return Promise.resolve(db);
        });
    }
}
exports.getInstance = getInstance;
function setupConnection() {
    try {
        const { MONGO_CONNECTION } = process.env;
        const requiredFields = !!(MONGO_CONNECTION);
        if (!requiredFields) {
            throw new Error('MONGO_CONNECTION undefined. exiting process.');
        }
        const options = {};
        return mongo.MongoClient.connect(MONGO_CONNECTION, options)
            .then(_client => {
            client = _client;
            client.on('error', debug);
            const db = client.db();
            return Promise.resolve(db);
        });
    }
    catch (e) {
        throw new Error(e);
    }
}