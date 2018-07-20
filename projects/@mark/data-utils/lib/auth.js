"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@mark/utils");
const debugV = require('debug')('mark-sys:auth');
const db = require("@mark/db");
function authBasic(req, res, next) {
    const token = req.header('Authorization');
    debugV('auth-basic:', token);
    if (!token) {
        return utils_1.rest.Response.fromUnauthorized().send(res);
    }
    db.tokens.getByToken(token)
        .then(tokenRecord => {
        if (!tokenRecord) {
            return utils_1.rest.Response.fromUnauthorized().send(res);
        }
        else {
            const { owner } = tokenRecord;
            db.users.getByHandle(owner)
                .then(userRecord => {
                res.locals = Object.assign({}, res.locals, { userRecord,
                    tokenRecord });
                next();
            });
        }
    });
}
exports.authBasic = authBasic;
function authAnon(req, res, next) {
    debugV('auth-anon:');
    next();
}
exports.authAnon = authAnon;
function notAllowed(req, res, next) {
    utils_1.rest.Response.fromNotAllowed().send(res);
}
exports.notAllowed = notAllowed;