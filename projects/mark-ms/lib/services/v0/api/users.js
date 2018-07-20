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
router.route('/:handle')
    .get(authBasic, verify, respond(getAccount))
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