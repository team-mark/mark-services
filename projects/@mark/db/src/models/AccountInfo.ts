import { mongoDb } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IAccountInfoConsumer extends IModelConsumer {
    phoneh: string;
}
export interface IAccountInfoDb extends IModelDb {
    phoneh: string;
    refI: string;
}

const COLLECTION_NAME = 'accountInfo';

export class AccountInfo extends Model<IAccountInfoDb, IAccountInfoConsumer> {
    private accounts: mongoDb.ICollection<IAccountInfoDb>;

    public constructor() {
        super(COLLECTION_NAME);
        this.accounts = this.collection;
    }

    public create(phoneh: string, refI: string, state?: string): Promise<IAccountInfoDb> {

        // const encryptedPrivateKey = ''; // z_a XOR privateKey;

        const accountInfo: IAccountInfoDb = {
            phoneh,
            refI,
            state
        };

        return this.insertOne(accountInfo);
    }

    public existsByPhoneHash(phoneh: string) {
        const filter: mongoDb.IFilter<Partial<IAccountInfoDb>> = { phoneh };
        return this.exists(filter);
    }

    public existsByRefI(refI: string) {
        const filter: mongoDb.IFilter<Partial<IAccountInfoDb>> = { refI };
        return this.exists(filter);
    }
}