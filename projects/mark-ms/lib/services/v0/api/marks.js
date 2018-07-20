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
router.route('/')
    .get(authBasic, verify, respond(listMarks))
    .post(authBasic, verify, respond(postMark))
    .all(notAllowed);
function listMarks(req, res, next) {
    return null;
}
function markFetch(req, res, next) {
    let { sort, skip, limit, ids } = req.query;
    const query = [];
    sort = parseInt(sort);
    skip = parseInt(skip);
    limit = parseInt(limit);
    const { userRecord } = res.locals;
    if (!limit)
        limit = 10;
    if (!skip)
        skip = 0;
    if (!sort)
        sort = 0;
    if (ids) {
        ids = JSON.parse(ids);
        query.push({
            $match: {
                ethereum_id: { $in: ids }
            }
        });
        query.push({
            $addFields: {
                __order: { $indexOfArray: [ids, '$ethereum_id'] }
            }
        });
        query.push({
            $sort: {
                __order: 1
            }
        });
        return db.marks.getMarksAggregate(query)
            .then(marks => {
            return Promise.resolve(utils_1.rest.Response.fromSuccess(marks));
        });
    }
    return db.marks.getMarks(sort, skip, limit).then(marks => {
        return Promise.resolve(utils_1.rest.Response.fromSuccess(marks));
    });
}
function postMark(req, res, next) {
    const { body, passwordh } = req.body;
    const { userRecord } = res.locals;
    data_utils_1.bots.runBotCheck(userRecord.handle);
    if (!body)
        return Promise.resolve(utils_1.rest.Response.fromBadRequest('field_required', 'body required'));
    if (!passwordh)
        return Promise.resolve(utils_1.rest.Response.fromBadRequest('field_required', 'passwordh required'));
    return db.marks.create(body, userRecord, passwordh)
        .then(mark => Promise.resolve(utils_1.rest.Response.fromSuccess({ mark: mark._id })));
}