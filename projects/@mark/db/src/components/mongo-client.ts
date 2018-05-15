import * as mongo from 'mongodb';
const debug = require('debug')('mark:db');

let db: mongo.Db;
let client: mongo.MongoClient;

/**
 * Get a single instance of a connected client.
 * Connection information is provided in MONGO_CONNECTION application settings.
 */
export function getInstance(): Promise<mongo.Db> {
    if (db) {
        return Promise.resolve(db);
    } else {
        return setupConnection()
            .then(_db => {
                db = _db;

                // db.on('error', error => { throw error; });

                return Promise.resolve(db);
            });
    }
}

/**
 * Acquires new connection instance.
 */
function setupConnection(): Promise<mongo.Db> {
    try {
        const MONGO_CONNECTION = process.env.MONGO_CONNECTION;
        const requiredFields: boolean = !!(MONGO_CONNECTION);
        if (!requiredFields) {
            throw new Error('MONGO_CONNECTION undefined. exiting process.');
        }

        const options: mongo.MongoClientOptions = {};
        return mongo.MongoClient.connect(MONGO_CONNECTION, options)
            .then(_client => {
                client = _client;
                client.on('error', debug);
                const db = client.db();
                return Promise.resolve(db);
            });
    } catch (e) { throw new Error(e); }
}