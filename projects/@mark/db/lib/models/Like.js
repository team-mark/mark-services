"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const COLLECTION_NAME = 'likes';
class Like extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
        this.likes = this.collection;
    }
    static map(like) {
        const mapped = {
            author: like.author,
            postId: like.postId
        };
        return mapped;
    }
    getUsersLikes(handle) {
        const filter = { author: handle };
        return this.findMany(filter)
            .then(likes => {
            return Promise.resolve(likes.map(Like.map));
        });
    }
    getMarkLikes(id) {
        const filter = { postId: id };
        return this.findMany(filter)
            .then(likes => {
            return Promise.resolve(likes.map(Like.map));
        });
    }
    checkLike(_postId, handle) {
        const filter = { author: handle, postId: _postId };
        return this.findOne(filter)
            .then(result => {
            if (result)
                return Promise.resolve(true);
            else
                return Promise.resolve(false);
        });
    }
    addLike(_postId, handle) {
        const likeDb = {
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
    getSortedLikes(sort, skip, size) {
        console.log(sort, skip, size);
        const filter = { $group: { _id: '$postId', likes: { $sum: 1 } } };
        const filter2 = { $sort: { likes: sort } };
        const cursor = this.aggregate([filter, filter2]);
        try {
            cursor.skip(skip);
            cursor.limit(size);
        }
        catch (error) {
            console.error(error);
        }
        return cursor.toArray()
            .then(records => {
            return Promise.resolve(records);
        });
    }
}
exports.Like = Like;