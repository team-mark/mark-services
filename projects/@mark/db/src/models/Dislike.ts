import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IDislikeConsumer extends IModelConsumer {
    ownerId: string;
    postId: string;
}

export interface IDislikeDb extends IModelDb {
    ownerId: mongo.ObjectID;
    postId: string;
}

const COLLECTION_NAME = 'dilikes';

export class Dislike extends Model<IDislikeDb, IDislikeConsumer> {
    private likes: mongoDb.ICollection<IDislikeDb>;

    public constructor() {
        super(COLLECTION_NAME);
        this.likes = this.collection;
    }

    public static map(like: IDislikeDb): IDislikeConsumer {

        const mapped: IDislikeConsumer = {
            ownerId: like.ownerId.toString(),
            postId: like.postId
        };

        return mapped;
    }
}