"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const utils_1 = require("@mark/utils");
const COLLECTION_NAME = 'tokens';
class Token extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
    }
    whitelist(refT, linkA, handle) {
        const TOKEN_LENGTH = 64;
        return utils_1.cryptoLib.generateSecureCode(utils_1.cryptoLib.AUTH_CODE_CHARS, TOKEN_LENGTH, true)
            .then(tokenString => {
            const token = {
                token: tokenString,
                refT,
                linkA,
                owner: handle
            };
            return this.insertOne(token);
        });
    }
    getById(id) {
        return this.getByToken(id);
    }
    getByToken(token) {
        const filter = { token };
        return this.findOne(filter);
    }
    static mapForConsumer(tokenRecord) {
        return {
            token: tokenRecord.token
        };
    }
    deletebyToken(token) {
        const filter = { token };
        return this.collection.deleteOne(filter);
    }
}
exports.Token = Token;