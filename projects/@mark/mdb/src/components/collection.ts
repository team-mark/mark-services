// import * as client from './mongo-client';
// import * as models from '../models';
// import * as mongo from 'mongodb';
// import { Account, Token } from '../models';
// import * as db from './db';

// // Export types for convenience
// export type ICollection = mongo.Collection;
// export type IFilter<T = any> = mongo.FilterQuery<T>;

// // reference: https://docs.mongodb.com/manual/reference/command/createIndexes/
// export type CollectionIndex = {
//     key: { [key: string]: any },
//     name: string,
//     unique: boolean,
//     [key: string]: any
// };

// // Query functions
// export interface CrudResult<T = any> {
//     success: boolean;
//     nChanged: number;
//     value?: T;
// }

// export class Collection<T> {

//     protected collection: mongo.Collection;
//     public constructor(protected name: string) {
//         this.collection = getcollection(name);
//     }

//     protected exists(query: IFilter): Promise<boolean> {
//         return this.collection.findOne(query)
//             .then(docs => !!(docs.lenght));
//     }

//     protected findOne(query: IFilter): Promise<T> {
//         return this.collection.findOne(query);
//     }

//     protected findMany(query: IFilter): Promise<T[]> {
//         const cursor = this.collection.find(query);
//         return this.selectPromise(cursor);
//     }
//     /**
//      * Select items matching your query from the database.
//      * @param cursor
//      */
//     private selectPromise<T>(cursor: mongo.Cursor): Promise<T[]> {
//         return cursor.toArray();
//     }

//     private dPromise<T>(): Promise<CrudResult> {
//         return null;
//     }
//     private uPromise<T>(): Promise<CrudResult> {
//         return null;
//     }
//     private cPromise<T>(): Promise<CrudResult> {
//         return null;
//     }
// }