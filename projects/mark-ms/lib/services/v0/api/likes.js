"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
module.exports = router;
const db = require("@mark/db");
const utils_1 = require("@mark/utils");
const data_utils_1 = require("@mark/data-utils");
const debug = require('debug')('mark:accounts');
const { authBasic, authAnon, notAllowed } = data_utils_1.auth;
const { verify } = utils_1.rest;
const respond = utils_1.rest.promiseResponseMiddlewareWrapper(debug);
router.get('/', authBasic, verify, respond(likesByUser));
router.get('/sort', authBasic, verify, respond(likesSorted));
router.get('/:id', authBasic, verify, respond(likesOnPost));
router.post('/', authBasic, verify, respond(likePost));
function likesByUser(req, res, next) {
    return db.likes.getUsersLikes(res.locals.owner)
        .then(likes => {
        return Promise.resolve(utils_1.rest.Response.fromSuccess(likes));
    });
}
function likesSorted(req, res, next) {
    let { sort, skip, size } = req.query;
    sort = parseInt(sort);
    skip = parseInt(skip);
    size = parseInt(size);
    return db.likes.getSortedLikes(sort, skip, size)
        .then(result => {
        if (result)
            return Promise.resolve(utils_1.rest.Response.fromSuccess(result));
        else
            return Promise.reject(utils_1.rest.Response.fromNotFound());
    });
}
function likesOnPost(req, res, next) {
    return db.likes.getMarkLikes(req.params.id)
        .then(likes => {
        return Promise.resolve(utils_1.rest.Response.fromSuccess(likes));
    });
}
function likePost(req, res, next) {
    return db.likes.addLike(req.body.postId, res.locals.owner)
        .then(result => {
        if (result)
            return Promise.resolve(utils_1.rest.Response.fromSuccess());
        else
            return Promise.resolve(utils_1.rest.Response.fromUnknownError());
    }, rejected => {
        return Promise.resolve(utils_1.rest.Response.fromNotAllowed());
    });
}