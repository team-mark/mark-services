import { db } from '../components';
import * as mongo from 'mongodb';

export interface IModelDb {
    _id: mongo.ObjectID;
}

export interface IModelConsumer {
    id: string;
}

export default class Model<T extends IModelDb, T1 extends IModelConsumer> extends db.Collection<T> {

    protected constructor(name: string) {
        super(name);
    }

    public getById(id: string): Promise<T> {
        const filter: db.IFilter<T> = { _id: id };
        return this.collection.findOne(filter);
    }

    public getByIds(ids: string[]): Promise<T[]> {
        const filter: db.IFilter<T> = { _id: { $in: ids } };
        return this.findMany(filter);
    }
}