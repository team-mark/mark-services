import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface ILikeConsumer extends IModelConsumer {
    ownerId: string;
    postId: string;
}

export interface ILikeDb extends IModelDb {
    ownerId: mongo.ObjectID;
    postId: string;
}

const COLLECTION_NAME = 'marks';

export class Like extends Model<ILikeDb, ILikeConsumer> {
    private likes: mongoDb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.likes = this.collection;
    }

    public static map(like: ILikeDb): ILikeConsumer {

        const mapped: ILikeConsumer = {
            ownerId: like.ownerId.toString(),
            postId: like.postId
        };

        return mapped;
    }
}