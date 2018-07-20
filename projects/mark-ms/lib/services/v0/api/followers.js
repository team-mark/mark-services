"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
module.exports = router;
const db = require("@mark/db");
const data_utils_1 = require("@mark/data-utils");
const utils_1 = require("@mark/utils");
const debug = require('debug')('mark:users');
const { authBasic } = data_utils_1.auth;
const { verify } = utils_1.rest;
const respond = utils_1.rest.promiseResponseMiddlewareWrapper(debug);
router.route('/followers')
    .get(authBasic, verify, respond(listFollowers))
    .all(utils_1.rest.notAllowed);
router.route('/followers/:handle')
    .put(authBasic, verify, respond(addFollower))
    .delete(authBasic, verify, respond(removeFollower))
    .all(utils_1.rest.notAllowed);
function getAccount(req, res, next) {
    console.log('req.params users', req.params);
    const { handle } = req.params;
    return db.users.getByHandle(handle)
        .then(user => {
        if (user) {
            return Promise.resolve(utils_1.rest.Response.fromSuccess(db.User.map(user)));
        }
        else {
            return Promise.resolve(utils_1.rest.Response.fromNotFound({ handle }));
        }
    });
}
function listFollowers(req, res, next) {
    const { userRecord } = res.locals;
    return db.users.getFollowers(userRecord.handle)
        .then(followers => {
        return utils_1.rest.Response.fromSuccess({ followers });
    });
}
function removeFollower(req, res, next) {
    const { userRecord } = res.locals;
    const { handle: followerHandle } = req.params;
    const { handle: targetHandle } = userRecord;
    return db.users.removeFollower(followerHandle, targetHandle)
        .then(() => utils_1.rest.Response.fromSuccess());
}
function addFollower(req, res, next) {
    const { userRecord } = res.locals;
    const { handle: followerHandle } = req.params;
    const { handle: targetHandle } = userRecord;
    return db.users.addFollower(followerHandle, targetHandle)
        .then(() => utils_1.rest.Response.fromSuccess());
}