"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
module.exports = router;
const db = require("@mark/db");
const utils_1 = require("@mark/utils");
const data_utils_1 = require("@mark/data-utils");
const debug = require('debug')('mark:feed');
const { authBasic, authAnon, notAllowed } = data_utils_1.auth;
const { verify } = utils_1.rest;
const respond = utils_1.rest.promiseResponseMiddlewareWrapper(debug);
router.route('/')
    .get(authBasic, verify, respond(listFeed))
    .all(notAllowed);
function listFeed(req, res, next) {
    const { options } = req.query;
    const { userRecord } = res.locals;
    const { handle } = userRecord;
    let opts;
    if (options) {
        opts = new Buffer(options, 'base64').toString();
    }
    else {
        opts = {
            limit: 100
        };
    }
    debug('calling feed');
    return db.marks.listFeed(handle, opts)
        .then(markItems => {
        debug('items', markItems);
        const { items, nextId } = markItems;
        let next;
        if (nextId) {
            const nextObject = {
                nextId,
                nextField: '_id',
                nextDirection: '$gte',
                limit: opts.limit
            };
            const nextObjectString = nextObject.toString();
            next = new Buffer(nextObjectString).toString('base64');
        }
        return Promise.resolve(utils_1.rest.Response.fromSuccess({
            items: items.map(db.Mark.map),
            next
        }));
    });
}