import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import { cryptoLib } from '@mark/utils';
import { IAccountInfoDb } from '.';
const debug = require('debug')('mark:Model');

// Data structure to be passed and retrieved from
// a database.
export interface IModelDb {
    _id?: mongo.ObjectID;
    environment?: string;
    state?: string;
    createdAt?: Date;
}

// Format data to be given to the client
export interface IModelConsumer {
    id?: string;
    createdAt?: string;
}

export default class Model<T extends IModelDb, T1 extends IModelConsumer> extends mongoDb.Collection<T> {

    protected constructor(protected name: string) {
        super(name);
    }

    /**
     * Formats id string as mongo ObjectId
     * @param id mongo id string/value
     */
    public static formatId(id: string | mongo.ObjectID | object): mongo.ObjectID {
        if (typeof id === 'string') {
            try {
                return new mongo.ObjectID(id);
            } catch (e) {
                debug(e);
                return undefined;
            }
        } else if ((id as Object).constructor === mongo.ObjectID) {
            return id as mongo.ObjectID;
        }
        return undefined;
    }

    /**
     * Formats id object as consumable string
     * @param id
     */
    public static mapId(id: mongo.ObjectID | string): string {
        if ((id as Object).constructor === mongo.ObjectID) {
            return (id as mongo.ObjectID).toHexString();
        } else {
            try {
                return id.toString();
            } catch (e) {
                debug(e);
                return undefined;
            }
        }
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

    public deleteByState(state: string) {
        const filter: mongoDb.IFilter<T> = { state };
        this.collection.deleteMany(filter);
    }
}