
import { mongoDb, W3, ethereum } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';
import { authentication } from '@mark/utils';
const debug = require('debug')('mark:Account');
import * as util from 'util';
export interface IUserConsumer extends IModelConsumer {
    handle: string;
    // privateKeyH: string;
    address: string;
    // link_a: string;
    // ref_a: string;
    balance: string;
    avatar: string;
}

// update over in @mark/utils/rest if changes made here
export interface IUserDb extends IModelDb {
    handle: string;
    refPK: string;
    address: string;
    linkI: string;
    refU: string;
    // followers: string[]; // list of handles
    // following: string[]; // list of handles
    profilePicture: string;
    balance: string;
}

export interface IFollowingDb extends IModelDb {
    owner: string; // handle
    following: string; // handle
    hash: string; // add uniqueness to record b64(`${followerHandle}:${targetHandle}`)
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
    private users: mongoDb.ICollection<IUserDb>;
    private following: mongoDb.Collection<IFollowingDb>; // mongoDb.ICollection<IFollowingDb>;

    public indexes: mongoDb.CollectionIndex[] = [
        {
            key: {
                handle: 1,
            },
            name: 'handle_index_v0',
            unique: true
        },
    ];

    public constructor() {
        super(COLLECTION_NAME);
        this.users = this.collection;
        this.following = new mongoDb.Collection('following');
    }

    public static map(user: IUserDb): IUserConsumer {
        const mappedUser: IUserConsumer = {
            handle: user.handle,
            address: user.address,
            balance: user.balance,
            avatar: user.profilePicture,
        };
        return mappedUser;
    }

    public create(userId: string | object, handle: string, refU: string, linkPK: string, state?: string): Promise<IUserDb> {

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
            // linkI,
            linkI: undefined,
            refU,
            state,
            // followers: [],
            // following: [],
            profilePicture: undefined,
            balance: '0'
        };

        debug('user', user);
        return this.insertOne(user);
    }
    public checkIfExists(handle: string): Promise<boolean> {
        // TODO: hash username and search
        const handleHash = handle;
        const filter: mongoDb.IFilter = { handleh: handle };
        return this.exists(filter);
    }

    public updateById(id: string | object, modifications: any): Promise<IUserDb> {
        const filter = { _id: User.formatId(id) };
        const update = { $set: { ...modifications } };
        // forced 'as any' to comply with typiungs. Typings are set to 3.0, but
        // database is setup for 3.6 and these options are compliant with 3.6.
        // see https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/#db-collection-findoneandupdate
        const options = { returnNewDocument: true } as any; // forced

        // Also forced, outdated typings
        return (this.users.findOneAndUpdate(filter, update, options) as any as Promise<any>)
            .then((result: FindAndModifyWriteOpResultObject<IUserDb>) => {
                debug(`Updating by ${util.inspect(filter, true, null)}. Response: ${util.inspect(result, true, null)}`);
                return Promise.resolve(result.value);
            });
    }

    public existsByHandle(handle: string) {
        const filter: mongoDb.IFilter<Partial<IUserDb>> = { handle };
        return this.exists(filter);
    }

    public getByHandle(handle: string) {
        const filter: mongoDb.IFilter<IUserDb> = { handle };
        return this.users.findOne<IUserDb>(filter);
    }

    public getManyByHandle(handles: string[]) {
        const filter: mongoDb.IFilter<IUserDb> = { handle: { $in: handles } };
        return this.findMany(filter);
    }

    public updateByHandle(handle: string, modifications: any) {
        const filter: mongoDb.IFilter<IUserDb> = { handle };
        return this.users.updateOne(filter, { $set: { ...modifications } })
            .then(updateWriteOpResult => Promise.resolve());

    }

    public getFollowers(handle: string) {
        const query = { following: handle };
        return this.following.findMany(query);
    }

    public getFollowing(handle: string) {
        const query = { owner: handle };
        debug('query', query);
        debug('this.following', this.following);
        return this.following.findMany(query);
    }

    public addFollower(owner: string, following: string) {
        const followingRecord: IFollowingDb = {
            owner,
            following,
            hash: Buffer.from(`${owner}:${following}`).toString('base64')
        };

        return this.following.insertOne(followingRecord);
    }

    public removeFollower(followerHandle: string, targetHandle: string): Promise<any> {
        const followingRecord: IFollowingDb = {
            owner: followerHandle,
            following: targetHandle,
            hash: Buffer.from(`${followerHandle}:${targetHandle}`).toString('base64')
        };

        return this.following.deleteOne(followingRecord);
    }

    public updateProfilePicture(handle: string, url: string) {
        const modifications: Partial<IUserDb> = { profilePicture: url };
        return this.updateByHandle(handle, modifications);
    }

    public fundUserAccount(handle: string): Promise<void> {
        return this.getByHandle(handle)
            .then(userRecord => ethereum.fundAccount(userRecord.address))
            .then(res => {
                const eth = W3.getInstance().utils.fromWei(res.tx.v, 'ether');
                return this.updateByHandle(handle, { balance: eth });
            })
            .then(updateResult => Promise.resolve(undefined));
    }

    public getBlance(handle: string): Promise<string> {
        return this.getByHandle(handle)
            .then(userRecord => ethereum.getBalance(userRecord.address));
    }

    public getGasPrice(): Promise<string> {
        debug('getgas');
        return ethereum.getGasPrice();
    }

    public searchBarQuery(queryString: string): Promise<IUserDb[]> {
        const DEFAULT_LIMIT = 15;
        const filter = { handle: { $regex: new RegExp(`.*${queryString}.*`, 'ig') } };
        const options = {};
        const sort = {};
        const limit = DEFAULT_LIMIT;

        return this.query<IUserDb>(filter, options, sort, limit)
            .then(queryMeta => {
                const users = queryMeta.items;
                return Promise.resolve(users);
            });
    }

}
