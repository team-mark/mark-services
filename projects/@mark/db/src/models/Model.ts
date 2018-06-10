import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import { cryptoLib } from '@mark/utils';
const debug = require('debug')('mark-ms:Model');

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

    public existsByPhoneHash(phoneh: string) {
        const filter: mongoDb.IFilter<T> = { phoneh };
        return this.exists(filter);
    }

    public existsByHandle(handle: string) {
        const filter: mongoDb.IFilter<T> = { handle };
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