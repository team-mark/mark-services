"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("./models");
exports.AccountInfo = models_1.AccountInfo;
exports.Mark = models_1.Mark;
exports.Token = models_1.Token;
exports.User = models_1.User;
exports.Like = models_1.Like;
const components_1 = require("./components");
var models_2 = require("./models");
exports.IMarkConsumer = models_2.IMarkConsumer;
exports.IMarkDb = models_2.IMarkDb;
exports.IAccountInfoConsumer = models_2.IAccountInfoConsumer;
exports.IAccountInfoDb = models_2.IAccountInfoDb;
exports.ITokenConsumer = models_2.ITokenConsumer;
exports.ITokenDb = models_2.ITokenDb;
exports.IUserConsumer = models_2.IUserConsumer;
exports.IUserDb = models_2.IUserDb;
exports.ILikeDb = models_2.ILikeDb;
exports.ILikeConsumer = models_2.ILikeConsumer;
const debug = require('debug')('mark:db');
const collectionMap = {
    accountInfo: models_1.AccountInfo,
    tokens: models_1.Token,
    users: models_1.User,
    marks: models_1.Mark,
    likes: models_1.Like
};
exports.newObjectId = components_1.mongoDb.newObjectId;
exports.ObjectID = components_1.mongoDb.ObjectID;
function init() {
    return components_1.mongoDb.initalize()
        .then(() => {
        debug('connection complete, setting up mongo cache');
        Object.keys(collectionMap).forEach(collectionName => {
            this[collectionName] = exports[collectionName] = new collectionMap[collectionName]();
        });
        return Promise.resolve();
    });
}
exports.init = init;