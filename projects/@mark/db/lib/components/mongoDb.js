"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client = require("./mongo-client");
const mongo = require("mongodb");
const debug = require('debug')('mark:db');
const util = require("util");
exports.ObjectID = mongo.ObjectID;
let db;
function initalize() {
    debug('initalize');
    return getConnectionInstance()
        .then(() => Promise.resolve());
}
exports.initalize = initalize;
function getConnectionInstance() {
    debug('getConnectionInstance');
    if (db) {
        debug('getConnectionInstance: returning instance');
        return Promise.resolve(db);
    }
    else {
        debug('getConnectionInstance: getting connection instance');
        return client.getInstance()
            .then(_db => {
            db = _db;
            return Promise.resolve(db);
        });
    }
}
exports.getConnectionInstance = getConnectionInstance;
function getCollection(collectionName) {
    return db.collection(collectionName);
}
exports.getCollection = getCollection;
function createCollection(collectionName) {
    const options = {};
    return db.createCollection(collectionName, options);
}
function listIndexesByCollection(collectionName) {
    const cursor = db.collection(collectionName).listIndexes();
    return selectPromise(cursor);
}
exports.listIndexesByCollection = listIndexesByCollection;
class Collection {
    constructor(name) {
        this.name = name;
        this.collection = getCollection(name);
    }
    ensure(doc) {
        if (!doc.hasOwnProperty('_id')) {
            doc._id = newObjectId();
        }
        if (!doc.hasOwnProperty('createdAt')) {
            doc.createdAt = new Date();
        }
        const { ENVIRONMENT } = process.env;
        if (ENVIRONMENT !== 'production') {
            doc.environment = 'development';
        }
    }
    exists(query) {
        return this.collection.findOne(query)
            .then(doc => !!doc);
    }
    findOne(query) {
        return this.collection.findOne(query);
    }
    aggregate(query) {
        return this.collection.aggregate(query);
    }
    findMany(query) {
        const cursor = this.collection.find(query);
        return selectPromise(cursor);
    }
    deleteOne(query) {
        return this.collection.deleteOne(query);
    }
    deleteMany(query) {
        return this.collection.deleteMany(query);
    }
    query(query, options, sort, limit, nextField, nextId, nextDirection) {
        debug('query', query, options, sort, limit, nextField);
        const DEFAULT_LIMIT = 100;
        let nextFieldValue;
        limit = limit | DEFAULT_LIMIT;
        debug('query', query, options, sort, limit, nextField, nextFieldValue);
        if (nextId) {
            query = Object.assign({}, query, { [nextField]: { [nextDirection]: nextId } });
        }
        debug('querystructure', util.inspect(query, true, null));
        const cursor = this.collection.find(query, options);
        debug('cursor');
        return cursor
            .limit(limit)
            .sort(sort)
            .hasNext()
            .then(hasNext => {
            if (hasNext) {
                return cursor
                    .next()
                    .then(nextDocument => {
                    debug('nextDocument', util.inspect(nextDocument));
                    nextFieldValue = nextDocument[nextField];
                    return Promise.resolve(cursor.toArray());
                });
            }
            else {
                return cursor.toArray();
            }
        })
            .then(items => Promise.resolve({
            items,
            nextId: nextFieldValue
        }));
    }
    insertOne(doc, options) {
        this.ensure(doc);
        return this.collection.insertOne(doc, options)
            .then(result => Promise.resolve(doc));
    }
    insertMany(docs, options) {
        return this.collection.insertMany(docs, options);
    }
}
exports.Collection = Collection;
function selectPromise(cursor) {
    return cursor.toArray();
}
function dPromise() {
    return null;
}
function uPromise() {
    return null;
}
function cPromise() {
    return null;
}
function newObjectId() {
    return new mongo.ObjectId();
}
exports.newObjectId = newObjectId;