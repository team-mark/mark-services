"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Model_1 = require("./Model");
const COLLECTION_NAME = 'accountInfo';
class AccountInfo extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
        this.accounts = this.collection;
    }
    create(phoneh, refI, state) {
        const accountInfo = {
            phoneh,
            refI,
            state
        };
        return this.insertOne(accountInfo);
    }
    existsByPhoneHash(phoneh) {
        const filter = { phoneh };
        return this.exists(filter);
    }
    existsByRefI(refI) {
        const filter = { refI };
        return this.exists(filter);
    }
}
exports.AccountInfo = AccountInfo;