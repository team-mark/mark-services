"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class IpfsPost {
    constructor(author, time, content) {
        this.author = author;
        this.time = time;
        this.content = content;
    }
    toJSON() {
        return {
            author: this.author,
            time: this.time,
            content: this.content
        };
    }
}
exports.IpfsPost = IpfsPost;