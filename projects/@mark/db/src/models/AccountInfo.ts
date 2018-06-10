import { mongoDb } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IAccountInfoConsumer extends IModelConsumer {
    phoneh: string;
}
export interface IAccountInfoDb extends IModelDb {
    phoneh: string;
    z_i: string;
}

const COLLECTION_NAME = 'accountInfo';

export class AccountInfo extends Model<IAccountInfoDb, IAccountInfoConsumer> {
    private accounts: mongoDb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.accounts = this.collection;
    }

    public create(phoneh: string, z_i: string): Promise<IAccountInfoDb> {

        // const encryptedPrivateKey = ''; // z_a XOR privateKey;

        const accountInfo: IAccountInfoDb = {
            phoneh,
        };

        return this.insertOne(accountInfo);
    }
}