import { db } from '../components';
import * as mongo from 'mongodb';
import { cryptoLib } from '@mark/utils';

// Data structure to be passed and retrieved from
// a database.
export interface IModelDb {
    _id: mongo.ObjectID;
}

// Format data to be given to the client
export interface IModelConsumer {
    id: string;
}

export default class Model<T extends IModelDb, T1 extends IModelConsumer> extends db.Collection<T> {

    protected constructor(name: string) {
        super(name);
    }

    public create<T extends IModelDb>(handle: string, phoneh: string) {
        const options: mongo.CollectionInsertOneOptions = {

        };
        const docs: any = {} as any;
        return this.collection.insertOne(docs, options)
            .then(result => {
                console.log(result);
            })
            .catch(error => console.log(error));
    }

    public existsByPhoneHash(phone: number | string) {
        const phoneh = cryptoLib.hashPhone(phone);
        const filter: db.IFilter<T> = { phoneh };
        return this.exists(filter);
    }

    // Get single documents by id
    public getById(id: string): Promise<T> {
        const filter: db.IFilter<T> = { _id: id };
        return this.collection.findOne(filter);
    }

    // Get multiple documents by id
    public getByIds(ids: string[]): Promise<T[]> {
        const filter: db.IFilter<T> = { _id: { $in: ids } };
        return this.findMany(filter);
    }
}