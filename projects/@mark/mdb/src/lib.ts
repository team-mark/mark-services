import * as models from './models';
import { Account, Token, User } from './models';
import { mdb } from './components';
export { IAccountConsumer, IAccountDb, ITokenConsumer, ITokenDb, IUserConsumer, IUserDb } from './models';
const debug = require('debug')('mark:mdb');

const queries = {} as any;

const accounts: Account = queries.accounts;
const tokens: Token = queries.tokens;
const users: User = queries.users;

// Export colllection methods
export {
    accounts,
    tokens,
    users
};

// Export class static functions
export { Account, Token, User };

export function init(): Promise<void> {
    return mdb.initalize()
        .then(() => {

            debug('connection complete, setting up mongo cache');

            const _queries = {
                accounts: new Account(),
                tokens: new Token(),
                users: new User()
            };

            Object.keys(_queries).forEach(query => {
                (queries as any)[query] = (_queries as any)[query];
            });

            return Promise.resolve();

            // Programmatic indexes (maybe later)

            // // Configure unique indexes
            // const indexes: mdb.CollectionIndex[] = [];
            // const indexesByCollection: { [collection: string]: mdb.CollectionIndex[] } = {};

            // Object.keys(queries).forEach(collectionName => {
            //     const localIndexes: mdb.CollectionIndex[] = (queries as any)[collectionName].indexes;
            //     if (localIndexes) {

            //         mdb.listIndexesByCollection(collectionName)
            //             .then(indexes => {
            //                 const newIndexes = localIndexes.filter(index => {

            //                     indexes.find()
            //                 });

            //             });

            //         // ((queries as any)[modelName].indexes as mdb.CollectionIndex[]).forEach(indexes.push);
            //     }
            // });
        });
}
