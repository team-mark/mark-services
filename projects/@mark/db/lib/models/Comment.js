"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const IpfsPost_1 = require("./IpfsPost");
const ipfs_1 = require("../components/ipfs");
const COLLECTION_NAME = 'comments';
class Comment extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
        this.comments = this.collection;
    }
    static map(mark) {
        const mapped = {
            id: mark._id.toString(),
            ethereum_id: mark.ethereum_id,
            body: null,
            author: null,
        };
        return mapped;
    }
    retrieveComments(_postId) {
        const filter = { postId: _postId };
        const consumer = [];
        return this.findMany(filter)
            .then(comment_mdb => {
            const hashes = [];
            comment_mdb.forEach((comment_mdb, index) => {
                hashes.push(comment_mdb.ethereum_id);
                consumer.push(Comment.map(comment_mdb));
            });
            return ipfs_1.getManyIpfsPosts(hashes)
                .then(ipfs_posts => {
                for (let i = 0; i < ipfs_posts.length; i++) {
                    consumer[i].body = ipfs_posts[i].content;
                    consumer[i].author = ipfs_posts[i].author;
                }
                return Promise.resolve(consumer);
            });
        });
    }
    postComment(author, _postId, content) {
        const post = new IpfsPost_1.IpfsPost(author, new Date(), content);
        return ipfs_1.addIpfsPost(post)
            .then(hash => {
            const mark = {
                ethereum_id: hash,
                postId: _postId
            };
            return this.insertOne(mark);
        });
    }
}
exports.Comment = Comment;