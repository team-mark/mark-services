// import { mongoDb } from '../components';
// import Model, { IModelConsumer, IModelDb } from './Model';

// const COLLECTION_NAME = 'users';

// export interface IUserDb extends IModelDb {
//     handle: string; // unique handle
//     handleh: string; // handle hash
//     wallet: string;
//     owner: string;  // reference to account
// }

// export interface IUserConsumer extends IModelConsumer {
//     handle: string;
//     wallet: string;
// }

// export class User extends Model<IUserDb, IUserConsumer> {
//     private users: mongoDb.ICollection;
//     public indexes: mongoDb.CollectionIndex[] = [
//         {
//             key: {
//                 handle: 1,
//             },
//             name: 'handle_index_v0',
//             unique: true
//         },
//     ];

//     public constructor() {
//         super(COLLECTION_NAME);
//         this.users = this.collection;
//     }

//     public static map(user: IUserDb): IUserConsumer {
//         const mapped: IUserConsumer = {
//             id: user._id.toString(),
//             handle: user.handle,
//             wallet: user.wallet,
//         };
//         return mapped;
//     }

//     public checkIfExists(handle: string): Promise<boolean> {
//         // TODO: hash username and search
//         const handleHash = handle;
//         const filter: mongoDb.IFilter = { handleh: handle };
//         return this.exists(filter);
//     }

//     public create(handle: string) {
//         return this.checkIfExists(handle)
//             .then(exists => {

//             });
//         // check if username exists.
//         // get wallet
//         // return user record with placeholder wallet value
//         // return half-filled user record.
//     }

//     private createUserIfDoesNotExist(handle: string): Promise<IUserDb> {
//         // return this.users.;
//         return null;
//     }

//     public getByHandle(handle: string): Promise<IUserDb> {
//         return null;
//     }
// }

import { mongoDb, W3 } from '../components';
import { cryptoLib } from '@mark/utils';
import Model, { IModelConsumer, IModelDb } from './Model';
import { authentication } from '../../../utils/lib/index';
const debug = require('debug')('mark:Account');

export interface IUserConsumer extends IModelConsumer {
    handle: string;
    // privateKeyH: string;
    address: string;
    // link_a: string;
    // ref_a: string;
}
export interface IUserDb extends IModelDb {
    handle: string;
    refPK: string;
    address: string;
    linkI: string;
    refA: string;
}

export interface IEthereumAccount {
    address: string; // "0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01",
    privateKey: string; // "0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709",
    // signTransaction: Function; // function(tx){...},
    // sign: Function; // function(data){...},
    // encrypt: Function; // function(password){...}
}

const COLLECTION_NAME = 'users';

interface FindAndModifyWriteOpResultObject<T> {
    // Document returned from findAndModify command.
    value?: T;
    // The raw lastErrorObject returned from the command.
    lastErrorObject?: any;
    // Is 1 if the command executed correctly.
    ok?: number;
}

export class User extends Model<IUserDb, IUserConsumer> {
    private users: mongoDb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.users = this.collection;
    }

    public create(userId: string | object, handle: string, linkR: string, refA: string, linkI: string, linkPK: string): Promise<IUserDb> {

        const web3 = W3.getInstance();
        const ethWallet: IEthereumAccount = web3.eth.accounts.create();

        // {
        //     address: '0x8f56Abb01CB4FF518099133F3612A306ba6d6dF9',
        //     privateKey: '0x309de7e17d0f0b3e75087115febb90fca9b88ff76bca083aecfacb4f4e6b90e3',
        //     signTransaction: [Function: signTransaction],
        //     sign: [Function: sign],
        //     encrypt: [Function: encrypt]
        // }

        debug('ethWallet', ethWallet);
        const refPK = authentication.getRefPK(linkPK, ethWallet.privateKey);
        // const encryptedPrivateKey = cryptoLib.XORHexStrings(linkR, ethWallet.privateKey);
        // authentication
        const user: IUserDb = {
            _id: User.formatId(userId),
            handle,
            refPK,
            address: ethWallet.address,
            linkI,
            refA,
        };

        debug('user', user);
        return this.insertOne(user);
    }

    public updateById(id: string | object, modifications: any): Promise<IUserDb> {
        const filter = { _id: User.formatId(id) };
        const update = modifications;
        // forced 'as any' to comply with typiungs. Typings are set to 3.0, but
        // database is setup for 3.6 and these options are compliant with 3.6.
        // see https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/#db-collection-findoneandupdate
        const options = { returnNewDocument: true } as any; // forced

        // Also forced, outdated typings
        return (this.users.findOneAndUpdate(filter, update, options) as any as Promise<any>)
            .then((result: FindAndModifyWriteOpResultObject<IUserDb>) => {
                debug(`Updating by ${filter}. Response: ${result}`);
                return Promise.resolve(result.value);
            });
        // .then(result => {
        //     result.;
        // });
        // .then(result => { result.;});
    }
    // public create(handle: string, linkI: string, refA: string, linkR: string): Promise<IUserDb> {

    //     const web3 = W3.getInstance();
    //     const ethWallet = web3.eth.accounts.create();

    //     return cryptoLib.hash(linkR, ethWallet.privateKey.length)
    //         .then(hashedLinkR => {

    //             const encryptedPrivateKey = cryptoLib.XORStrings(hashedLinkR, ethWallet.privateKey);
    //             const account: IUserDb = {
    //                 handle,
    //                 privateKeyH: encryptedPrivateKey,
    //                 publicKey: ethWallet.publicKey,
    //                 address: ethWallet.address,
    //                 linkI,
    //                 refA,
    //             };

    //             return this.insertOne(account);
    //         });

    // }

    public getByHandle(handle: string): Promise<IUserDb> {
        return null;
    }
}
