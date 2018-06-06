import * as client from './mongo-client';
import * as models from '../models';
import * as mongo from 'mongodb';
import { AccountInfo, Token } from '../models';
const debug = require('debug')('mark:db');

// Export types for convenience
export type ICollection = mongo.Collection;
export type IFilter<T = any> = mongo.FilterQuery<T>;

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
function getCollection<T>(collectionName: string): mongo.Collection<T> {
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

export class Collection<T> {

    protected collection: mongo.Collection;
    public constructor(protected name: string) {
        this.collection = getCollection(name);
    }

    protected ensure(doc: { _id?: mongo.ObjectId, createdAt?: Date }) {
        if (!(doc as Object).hasOwnProperty('_id')) {
            doc._id = newObjectId();
        }
        if (!(doc as Object).hasOwnProperty('createdAt')) {
            doc.createdAt = new Date();
        }
    }

    protected exists(query: IFilter): Promise<boolean> {
        return this.collection.findOne(query)
            .then(doc => !!doc);
    }

    protected findOne(query: IFilter): Promise<T> {
        return this.collection.findOne(query);
    }

    protected findMany(query: IFilter): Promise<T[]> {
        const cursor = this.collection.find(query);
        return selectPromise(cursor);
    }

    protected insertOne<T = any>(doc: T, options?: mongo.CollectionInsertOneOptions): Promise<T> {
        this.ensure(doc);
        return this.collection.insertOne(doc, options)
            .then(result => Promise.resolve(doc));
    }

    protected insertMany(docs: any[], options?: mongo.CollectionInsertManyOptions): Promise<mongo.InsertWriteOpResult> {
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
