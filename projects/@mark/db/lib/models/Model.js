"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("../components");
const mongo = require("mongodb");
const debug = require('debug')('mark:Model');
class Model extends components_1.mongoDb.Collection {
    constructor(name) {
        super(name);
        this.name = name;
    }
    static formatId(id) {
        if (typeof id === 'string') {
            try {
                return new mongo.ObjectID(id);
            }
            catch (e) {
                debug(e);
                return undefined;
            }
        }
        else if (id.constructor === mongo.ObjectID) {
            return id;
        }
        return undefined;
    }
    static mapId(id) {
        if (id.constructor === mongo.ObjectID) {
            return id.toHexString();
        }
        else {
            try {
                return id.toString();
            }
            catch (e) {
                debug(e);
                return undefined;
            }
        }
    }
    getById(id) {
        const filter = { _id: id };
        return this.collection.findOne(filter);
    }
    getByIds(ids) {
        const filter = { _id: { $in: ids } };
        return this.findMany(filter);
    }
    deleteByState(state) {
        const filter = { state };
        this.collection.deleteMany(filter);
    }
}
exports.default = Model;