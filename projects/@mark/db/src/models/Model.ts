import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import { cryptoLib } from '@mark/utils';

// Data structure to be passed and retrieved from
// a database.
export interface IModelDb {
    _id?: mongo.ObjectID;
}

// Format data to be given to the client
export interface IModelConsumer {
    id: string;
}

export default class Model<T extends IModelDb, T1 extends IModelConsumer> extends mongoDb.Collection<T> {

    protected constructor(name: string) {
        super(name);
    }

    public existsByPhoneHash(phone: number | string) {
        const phoneh = cryptoLib.hashPhone(phone);
        const filter: mongoDb.IFilter<T> = { phoneh };
        return this.exists(filter);
    }

    // Get single documents by id
    public getById(id: string): Promise<T> {
        const filter: mongoDb.IFilter<T> = { _id: id };
        return this.collection.findOne(filter);
    }

    // Get multiple documents by id
    public getByIds(ids: string[]): Promise<T[]> {
        const filter: mongoDb.IFilter<T> = { _id: { $in: ids } };
        return this.findMany(filter);
    }
}