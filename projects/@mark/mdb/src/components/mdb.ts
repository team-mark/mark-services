import * as client from './mongo-client';
import * as models from '../models';
import * as mongo from 'mongodb';
import { Account, Token } from '../models';

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
    return getConnectionInstance()
        .then(() => Promise.resolve());
}

/**
 * Configures database connection instance. Resolves once a local database
 * instance is acquired.
 */
export function getConnectionInstance(): Promise<mongo.Db> {
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
    nChanged: number;
    value?: T;
}

export class Collection<T> {

    protected collection: mongo.Collection;
    public constructor(protected name: string) {
        this.collection = db.collection(name);
    }

    protected exists(query: IFilter): Promise<boolean> {
        return this.collection.findOne(query)
            .then(docs => !!(docs.lenght));
    }

    protected findOne(query: IFilter): Promise<T> {
        return this.collection.findOne(query);
    }

    protected findMany(query: IFilter): Promise<T[]> {
        const cursor = this.collection.find(query);
        return selectPromise(cursor);
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