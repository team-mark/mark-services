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

export interface ILikeSorted extends IModelConsumer {
    postId: string;
    likes: number;
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

        return this.findMany(filter)
            .then(likes => {
                return Promise.resolve(likes.map(Like.map));
            });
    }

    public getMarkLikes(id: string): Promise<ILikeConsumer[]> {
        const filter: mongoDb.IFilter<ILikeDb> = {postId: id};
        
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

    /**
     * Returns likes sorted by most or least likes.
     * @param sort      -1 for descending sort 1 for ascending sort
     * @param skip      Number of records to skip
     * @param size      Number of records to return
    */
    public getSortedLikes(sort: number, skip: number, size: number): Promise<ILikeSorted[]> {
        console.log(sort, skip, size);
        const filter: mongoDb.IFilter<ILikeDb> = {$group: {_id: '$postId', likes: {$sum: 1}}};
        const filter2: mongoDb.IFilter<ILikeDb> = {$sort: {likes: sort}};
        const cursor: mongoDb.IAggregationCursor<ILikeSorted> = this.aggregate([filter, filter2]);

        try {
            cursor.skip(skip);
            cursor.limit(size);
        } catch (error) {
            console.error(error);
        }

        return cursor.toArray()
            .then(records => {
                return Promise.resolve(records);
            });
    }
}