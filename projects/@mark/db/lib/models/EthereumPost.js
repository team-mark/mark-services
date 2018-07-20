"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EthereumPost {
    constructor(hash, parent, sibling, hashtag) {
        this.hash = hash;
        this.parent = parent;
        this.sibling = sibling;
        this.hashtag = hashtag;
    }
    toJSON() {
        return {
            hash: this.hash,
            parent: this.parent,
            sibling: this.sibling,
            hashtags: this.hashtag
        };
    }
}
exports.EthereumPost = EthereumPost;