import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth, bots } from '@mark/data-utils';
import { ILikeConsumer } from '@mark/db';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.get('/', authBasic, verify, respond(likesByUser));
router.get('/:id', authBasic, verify, respond(likesOnPost));
router.post('/', authBasic, verify, respond(likePost));

function likesByUser(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.getUsersLikes(res.locals.owner)
        .then(likes => {
            return Promise.resolve(rest.Response.fromSuccess(likes));
    });
}

function likesOnPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.getMarkLikes(req.query.postId)
        .then( likes => {
            return Promise.resolve(rest.Response.fromSuccess(likes));
        });
}

function likePost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.addLike(req.body.postId, res.locals.owner)
        .then(result => {
            if (result)
                return Promise.resolve(rest.Response.fromSuccess());
            else
                return Promise.resolve(rest.Response.fromUnknownError());
        }, rejected => {
            return Promise.resolve(rest.Response.fromNotAllowed());
        });
}
