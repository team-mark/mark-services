import * as mongo from 'mongodb';

const MONGO_CONNECTION = process.env.MONGO_CONNECTION;
let _db: mongo.Db;

/**
 * Get a single instance of a connected client.
 * Connection information is provided in MONGO_CONNECTION application settings.
 */
export function getInstance(): Promise<mongo.Db> {
    if (_db) {
        return Promise.resolve(_db);
    } else {
        return setupConnection()
            .then(db => {
                _db = db;
                return Promise.resolve(_db);
            });
    }
}

/**
 * Acquires new connection instance.
 */
function setupConnection(): Promise<mongo.Db> {
    try {
        const requiredFields: boolean = !!(MONGO_CONNECTION);
        if (!requiredFields) {
            throw new Error('MONGO_CONNECTION undefined. exiting process.');
        }

        const options: mongo.MongoClientOptions = {

        };

        return mongo.connect(MONGO_CONNECTION, options);

    } catch (e) { throw new Error(e); }
}