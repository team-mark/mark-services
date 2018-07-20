"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client = require("./mongo-client");
let db;
function getInstance() {
    if (db) {
        return Promise.resolve(db);
    }
    else {
        return client.getInstance()
            .then(_db => {
            db = _db;
            return Promise.resolve(db);
        });
    }
}
exports.getInstance = getInstance;