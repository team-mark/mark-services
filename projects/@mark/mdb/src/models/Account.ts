import { mdb } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IAccountConsumer extends IModelConsumer {
    phone: string;
}
export interface IAccountDb extends IModelDb {
    phone: string;
}

const COLLECTION_NAME = 'accounts';

export class Account extends Model<IAccountDb, IAccountConsumer> {
    private accounts: mdb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.accounts = this.collection;
    }
}