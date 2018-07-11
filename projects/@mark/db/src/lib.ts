import {
    // Account,
    AccountInfo,
    Mark,
    Token,
    User,
    Like
} from './models';
import { mongoDb } from './components';
// Initializes the database
// Initializes models of database collections
export {
    // IAccountDb,
    // IAccountConsumer,
    IMarkConsumer,
    IMarkDb,
    IAccountInfoConsumer,
    IAccountInfoDb,
    ITokenConsumer,
    ITokenDb,
    IUserConsumer,
    IUserDb,
    ILikeDb,
    ILikeConsumer
} from './models';

const debug = require('debug')('mark:db');

const collectionMap = {
    accountInfo: AccountInfo,
    // accounts: Account,
    tokens: Token,
    users: User,
    marks: Mark,
    likes: Like
} as any;

export const newObjectId = mongoDb.newObjectId;
export const ObjectID = mongoDb.ObjectID;

export let accountInfo: AccountInfo;
export let tokens: Token;
export let users: User;
export let marks: Mark;
export let likes: Like;

// Export class static functions
export { AccountInfo, Token, User, Mark, Like };

export function init(): Promise<void> {
    return mongoDb.initalize()
        .then(() => {

            debug('connection complete, setting up mongo cache');

            Object.keys(collectionMap).forEach(collectionName => {
                this[collectionName] = exports[collectionName] = new collectionMap[collectionName]();
            });

            return Promise.resolve();

            // Programmatic indexes (maybe later)

            // // Configure unique indexes
            // const indexes: db.CollectionIndex[] = [];
            // const indexesByCollection: { [collection: string]: db.CollectionIndex[] } = {};

            // Object.keys(queries).forEach(collectionName => {
            //     const localIndexes: db.CollectionIndex[] = (queries as any)[collectionName].indexes;
            //     if (localIndexes) {

            //         db.listIndexesByCollection(collectionName)
            //             .then(indexes => {
            //                 const newIndexes = localIndexes.filter(index => {

            //                     indexes.find()
            //                 });

            //             });

            //         // ((queries as any)[modelName].indexes as db.CollectionIndex[]).forEach(indexes.push);
            //     }
            // });
        });
}