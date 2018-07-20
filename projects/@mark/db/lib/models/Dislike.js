"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const COLLECTION_NAME = 'dilikes';
class Dislike extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
        this.likes = this.collection;
    }
    static map(like) {
        const mapped = {
            ownerId: like.ownerId.toString(),
            postId: like.postId
        };
        return mapped;
    }
}
exports.Dislike = Dislike;