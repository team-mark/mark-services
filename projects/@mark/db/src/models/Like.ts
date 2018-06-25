import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface ILikeConsumer extends IModelConsumer {
    author: string;
    postId: string;
}

export interface ILikeDb extends IModelDb {
    author: string;
    postId: string;
}

const COLLECTION_NAME = 'likes';

export class Like extends Model<ILikeDb, ILikeConsumer> {
    private likes: mongoDb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.likes = this.collection;
    }

    public static map(like: ILikeDb): ILikeConsumer {

        const mapped: ILikeConsumer = {
            author: like.author,
            postId: like.postId
        };

        return mapped;
    }

    public getUsersLikes(handle: string): Promise<ILikeConsumer[]> {
        const filter: mongoDb.IFilter<ILikeDb> = {author: handle};
        const consumer: ILikeConsumer[] = [];
        return this.findMany(filter)
            .then(likes => {
                return Promise.resolve(likes.map(Like.map));
            });
    }

    // Checks for like in the db with postId and handle
    // returns true for like in the db
    // false otherwise
    public checkLike(_postId: string, handle: string): Promise<Boolean> {
        const filter: mongoDb.IFilter<ILikeDb> = {author: handle, postId: _postId};
        return this.findOne(filter)
            .then(result => {
                if (result)
                    return Promise.resolve(true);
                else
                    return Promise.resolve(false);
            });
    }

    public addLike(_postId: string, handle: string): Promise<ILikeDb> {
        const likeDb: ILikeDb = {
            postId: _postId,
            author: handle
        };
        return this.checkLike(_postId, handle)
            .then(result => {
                if (result)
                    return Promise.reject(new Error('Like already exists'));
                else
                    return Promise.resolve(this.insertOne(likeDb));
            });
    }
}