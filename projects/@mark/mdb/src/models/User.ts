import { mdb } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';

const COLLECTION_NAME = 'accounts';

export interface IUserDb extends IModelDb {
    handle: string; // unique handle
    handleh: string; // handle hash
    wallet: string;
    owner: string;  // reference to account
}

export interface IUserConsumer extends IModelConsumer {
    handle: string;
    wallet: string;
}

export class User extends Model<IUserDb, IUserConsumer> {
    private users: mdb.ICollection;
    public indexes: mdb.CollectionIndex[] = [
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
    }

    public static map(user: IUserDb): IUserConsumer {
        const mapped: IUserConsumer = {
            id: user._id.toString(),
            handle: user.handle,
            wallet: user.wallet,
        };
        return mapped;
    }

    public checkIfExists(handle: string): Promise<boolean> {
        // TODO: hash username and search
        const handleHash = handle;
        const filter: mdb.IFilter = { handleh: handle };
        return this.exists(filter);
    }

    public create(handle: string) {
        return this.checkIfExists(handle)
            .then(exists => {

            });
        // check if username exists.
        // get wallet
        // return user record with placeholder wallet value
        // return half-filled user record.
    }

    private createUserIfDoesNotExist(handle: string): Promise<IUserDb> {
        // return this.users.;
        return null;
    }

    public getByHandle(handle: string): Promise<IUserDb> {

    }
}