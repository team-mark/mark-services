import * as client from './mongo-client';
import * as mongo from 'mongodb';

let db: mongo.Db;

/**
 * Configures database connection instance. Resolves once a local database
 * instance is acquired.
 */
export function getInstance(): Promise<mongo.Db> {
    if (db) {
        return Promise.resolve(db);
    } else {
        return client.getInstance()
            .then(_db => {
                db = _db;
                // Object.keys(models)
                return Promise.resolve(db);
            });
    }
}