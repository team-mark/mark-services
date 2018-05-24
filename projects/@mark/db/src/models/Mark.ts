// Database Interface for the Marks (Post) collection

import { db } from '../components';
import * as mongo from 'mongodb';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IMarkConsumer extends IModelConsumer {
    id: string;
    ethereum_id: string
    likes: number;
    dislikes: number;
}
export interface IMarkDb extends IModelDb {
    id: mongo.ObjectID;
    ethereum_id: string;
    likes: mongo.ObjectID[];
    dislikes: mongo.ObjectID[];
}

const COLLECTION_NAME = 'marks';

export class Mark extends Model<IMarkDb, IMarkConsumer> {
    private marks: db.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.marks = this.collection;
    }

    public static map(mark: IMarkDb): IMarkConsumer {
        const mapped: IMarkConsumer = {
            id: mark._id.toString(),
            handle: user.handle,
            wallet: user.wallet,
        };
        return mapped;
    }
}
