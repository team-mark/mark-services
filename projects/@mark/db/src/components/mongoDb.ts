import * as client from './mongo-client';
import * as mongo from 'mongodb';
const debug = require('debug')('mark:db');
import * as util from 'util';

// Export types for convenience
export type ICollection<T> = mongo.Collection<T>;
export type IFilter<T = any> = mongo.FilterQuery<T>;
// export type IQUeryOptions<T = any> = mongo.<T>;
export type IAggregationCursor<T = any> = mongo.AggregationCursor<T>;
export type ICursor<T = any> = mongo.Cursor<T>;
export const ObjectID = mongo.ObjectID;

// reference: https://docs.mongodb.com/manual/reference/command/createIndexes/
export type CollectionIndex = {
    key: { [key: string]: any },
    name: string,
    unique: boolean,
    [key: string]: any
};

let db: mongo.Db;

export function initalize(): Promise<void> {
    debug('initalize');
    return getConnectionInstance()
        .then(() => Promise.resolve());
}

/**
 * Configures database connection instance. Resolves once a local database
 * instance is acquired.
 */
export function getConnectionInstance() {
    debug('getConnectionInstance');
    if (db) {
        debug('getConnectionInstance: returning instance');
        return Promise.resolve(db);
    } else {
        debug('getConnectionInstance: getting connection instance');
        return client.getInstance()
            .then(_db => {
                db = _db;
                return Promise.resolve(db);
            });
    }
}

// Command functions
export function getCollection<T>(collectionName: string): mongo.Collection<T> {
    return db.collection<T>(collectionName);
}

function createCollection<T extends mongo.Collection>(collectionName: string): Promise<mongo.Collection<T>> {
    const options: mongo.DbCollectionOptions = {};
    return db.createCollection<T>(collectionName, options);
}

export function listIndexesByCollection(collectionName: string): Promise<any[]> {
    const cursor = db.collection(collectionName).listIndexes();
    return selectPromise(cursor);
}

// Query functions
export interface CrudResult<T = any> {
    success: boolean;
    nChanged?: number;
    value?: T;
}

// export interface CrudResult {
//     insertedCount: number;
//     // ops: Array<any>;
//     insertedIds: {[key: number]: mongo.ObjectID};
//     // connection: any;
//     result: { ok: number, n: number };
// }

export type NextQueryDirection = '$gte' | '$lte';

export class Collection<T> {

    protected collection: mongo.Collection<T>;
    public constructor(protected name: string) {
        this.collection = getCollection(name);
    }

    public ensure(doc: { _id?: mongo.ObjectId, createdAt?: Date, environment?: string }) {
        if (!(doc as Object).hasOwnProperty('_id')) {
            doc._id = newObjectId();
        }
        if (!(doc as Object).hasOwnProperty('createdAt')) {
            doc.createdAt = new Date();
        }

        const { ENVIRONMENT } = process.env;
        if (ENVIRONMENT !== 'production') {
            doc.environment = 'development';
        }
    }

    public exists(query: IFilter): Promise<boolean> {
        return this.collection.findOne(query)
            .then(doc => !!doc);
    }

    public findOne(query: IFilter): Promise<T> {
        return this.collection.findOne(query);
    }

    public aggregate(query: IFilter[]): mongo.AggregationCursor {
        return this.collection.aggregate(query);
    }

    public findMany(query: IFilter): Promise<T[]> {
        const cursor = this.collection.find(query);
        return selectPromise(cursor);
    }

    public deleteOne(query: IFilter) {
        return this.collection.deleteOne(query);
    }

    public deleteMany(query: IFilter) {
        return this.collection.deleteMany(query);
    }

    public query<T>(query: IFilter<T>, options: any, sort?: any, limit?: number, nextField?: string, nextId?: string, nextDirection?: NextQueryDirection): Promise<{
        items: T[],
        nextId: string
    }> {

        debug('query', query, options, sort, limit, nextField);

        const DEFAULT_LIMIT = 100;
        let nextFieldValue: string;
        limit = limit | DEFAULT_LIMIT;

        debug('query', query, options, sort, limit, nextField, nextFieldValue);

        // If next is specified, then use nextId as the new starting point in
        // the specified direction (direction <= nextId || nextId <= direction)
        if (nextId) {
            query = {
                ...(query as any),
                [nextField]: { [nextDirection]: nextId }
            };
        }

        debug('querystructure', util.inspect(query, true, null));

        const cursor = this.collection.find<T>(query, options);
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
                            nextFieldValue = (nextDocument as any)[nextField]; // assume _id
                            return Promise.resolve(cursor.toArray());
                        });
                } else {
                    return cursor.toArray();
                }
            })
            .then(items => Promise.resolve({
                items,
                nextId: nextFieldValue
            }));
    }

    public insertOne<T = any>(doc: T, options?: mongo.CollectionInsertOneOptions): Promise<T> {
        this.ensure(doc);
        return this.collection.insertOne(doc, options)
            .then(result => Promise.resolve(doc));
    }

    public insertMany(docs: any[], options?: mongo.CollectionInsertManyOptions): Promise<mongo.InsertWriteOpResult> {
        return this.collection.insertMany(docs, options);
        // .then(result => Promise.resolve());
    }

    /**
     * Select items matching your query from the database.
     * @param cursor
     */
}
function selectPromise<T>(cursor: mongo.Cursor | mongo.CommandCursor): Promise<T[]> {
    return cursor.toArray();
}

function dPromise<T>(): Promise<CrudResult> {
    return null;
}
function uPromise<T>(): Promise<CrudResult> {
    return null;
}
function cPromise<T>(): Promise<CrudResult> {
    return null;
}

export function newObjectId() {
    return new mongo.ObjectId();
}
