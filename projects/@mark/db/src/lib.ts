// Initializes the database
// Initializes models of database collections
// import * as models from './models';
import { Account, Token, User, Mark } from './models';
import { db } from './components';
export { IAccountConsumer, IAccountDb, ITokenConsumer, ITokenDb, IUserConsumer, IUserDb } from './models';
const debug = require('debug')('mark:db');

const collectionMap = {
    accounts: Account,
    tokens: Token,
    users: User,
    marks: Mark,
} as any;

export let accounts: Account; // queries.accounts;
export let tokens: Token; // queries.tokens;
export let users: User; // queries.users;
export let marks: Mark; // queries.marks;

// Export class static functions
export { Account, Token, User };

export function init(): Promise<void> {
    return db.initalize()
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
