console.log('in the lib');
import * as models from './models';
import { Account, Token, User } from './models';
import { mdb } from './components';
export { IAccountConsumer, IAccountDb, ITokenConsumer, ITokenDb, IUserConsumer, IUserDb } from './models';

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

            const _queries = {
                accounts: new Account(),
                tokens: new Token(),
                users: new User()
            };

            Object.keys(_queries).forEach(query => {
                (queries as any)[query] = (_queries as any)[query];
            });

            // Configure unique indexes
            const indexes: mdb.CollectionIndex[] = [];
            const indexesByCollection: { [collection: string]: mdb.CollectionIndex[] } = {};

            Object.keys(queries).forEach(collectionName => {
                if ((queries as any)[collectionName].indexes) {

                    mdb.listIndexesByCollection(collectionName)
                        .then(indexes => {
                            console.log('indexes', indexes);
                        });

                    // ((queries as any)[modelName].indexes as mdb.CollectionIndex[]).forEach(indexes.push);
                }
            });
        });
}
