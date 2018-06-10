// import { mongoDb, W3 } from '../components';
// import { cryptoLib } from '@mark/utils';
// import Model, { IModelConsumer, IModelDb } from './Model';
// const debug = require('debug')('mark:Account');

// export interface IAccountConsumer extends IModelConsumer {
//     handle: string;
//     // privateKeyH: string;
//     public_key: string;
//     address: string;
//     // link_a: string;
//     // ref_a: string;
// }
// export interface IAccountDb extends IModelDb {
//     handle: string;
//     privateKeyH: string;
//     publicKey: string;
//     address: string;
//     linkI: string;
//     refA: string;
// }

// export interface IEthereumAccount {
//     address: string; // "0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01",
//     privateKey: string; // "0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709",
//     signTransaction: Function; // function(tx){...},
//     sign: Function; // function(data){...},
//     encrypt: Function; // function(password){...}
// }

// const COLLECTION_NAME = 'accounts';

// interface FindAndModifyWriteOpResultObject<T> {
//     // Document returned from findAndModify command.
//     value?: T;
//     // The raw lastErrorObject returned from the command.
//     lastErrorObject?: any;
//     // Is 1 if the command executed correctly.
//     ok?: number;
// }

// export class Account extends Model<IAccountDb, IAccountConsumer> {
//     private accounts: mongoDb.ICollection;

//     public constructor() {
//         super(COLLECTION_NAME);
//         this.accounts = this.collection;
//     }

//     public create(accountId: string | object, handle: string, linkR: string, refA: string, linkI: string): Promise<IAccountDb> {

//         const web3 = W3.getInstance();
//         const ethWallet = web3.eth.accounts.create();

//         debug('ethWallet', ethWallet);

//         const encryptedPrivateKey = cryptoLib.XORHexStrings(linkR, ethWallet.privateKey);
//         const account: IAccountDb = {
//             _id: Account.formatId(accountId),
//             handle,
//             privateKeyH: encryptedPrivateKey,
//             publicKey: ethWallet.publicKey,
//             address: ethWallet.address,
//             linkI,
//             refA,
//         };

//         debug('account', account);
//         return this.insertOne(account);
//     }

//     public updateAccount(accountId: string | object, modifications: any): Promise<IAccountDb> {
//         const filter = { accountId: Account.formatId(accountId) };
//         const update = modifications;
//         // forced 'as any' to comply with typiungs. Typings are set to 3.0, but
//         // database is setup for 3.6 and these options are compliant with 3.6.
//         // see https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/#db-collection-findoneandupdate
//         const options = { returnNewDocument: true } as any; // forced

//         // Also forced, outdated typings
//         return (this.accounts.findOneAndUpdate(filter, update, options) as any as Promise<any>)
//             .then((result: FindAndModifyWriteOpResultObject<IAccountDb>) => {
//                 debug(`Updating by ${filter}. Response: ${result}`);
//                 return Promise.resolve(result.value);
//             });
//         // .then(result => {
//         //     result.;
//         // });
//         // .then(result => { result.;});
//     }
//     // public create(handle: string, linkI: string, refA: string, linkR: string): Promise<IAccountDb> {

//     //     const web3 = W3.getInstance();
//     //     const ethWallet = web3.eth.accounts.create();

//     //     return cryptoLib.hash(linkR, ethWallet.privateKey.length)
//     //         .then(hashedLinkR => {

//     //             const encryptedPrivateKey = cryptoLib.XORStrings(hashedLinkR, ethWallet.privateKey);
//     //             const account: IAccountDb = {
//     //                 handle,
//     //                 privateKeyH: encryptedPrivateKey,
//     //                 publicKey: ethWallet.publicKey,
//     //                 address: ethWallet.address,
//     //                 linkI,
//     //                 refA,
//     //             };

//     //             return this.insertOne(account);
//     //         });

//     // }
// }
