import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth, bots } from '@mark/data-utils';
import { ILikeConsumer } from '@mark/db';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon } = auth;
const { verify, notAllowed } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes

router.route('/')
    .get(authBasic, verify, respond(likesByUser))
    .put(authBasic, verify, respond(likePost))
    .all(notAllowed);
router.route('/sort')
    .get(authBasic, verify, respond(likesSorted))
    .all(notAllowed);
router.route('/:id')
    .get(authBasic, verify, respond(likesOnPost))
    .delete(authBasic, verify, respond(dislikePost))
    .all(notAllowed);

// router.delete('/:id', authBasic)

function likesByUser(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.getUsersLikes(res.locals.userRecord.handle)
        .then(likes => {
            return Promise.resolve(rest.Response.fromSuccess(likes));
        });
}

function likesSorted(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    let { sort, skip, size } = req.query;

    sort = parseInt(sort);
    skip = parseInt(skip);
    size = parseInt(size);

    return db.likes.getSortedLikes(sort, skip, size)
        .then(result => {
            if (result)
                return Promise.resolve(rest.Response.fromSuccess(result));
            else
                return Promise.reject(rest.Response.fromNotFound());
        });
}

function likesOnPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.getMarkLikes(req.params.id)
        .then( likes => {
            return Promise.resolve(rest.Response.fromSuccess({items: likes}));
        });
}

function likePost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord }: auth.BasicAuthFields = res.locals;
    
    if(!req.body.id)
        return Promise.resolve(rest.Response.fromUnknownError('No id in put body', 'no id in put body'));

    return db.likes.addLike(req.body.id, userRecord.handle)
        .then(result => {
            if (result)
                return Promise.resolve(rest.Response.fromSuccess());
            else
                return Promise.resolve(rest.Response.fromUnknownError());
        }, rejected => {
            return Promise.resolve(rest.Response.fromNotAllowed());
        });
}

function dislikePost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.removeLike(req.params.id, res.locals.userRecord.handle).then(result => {
        if (result)
            return Promise.resolve(rest.Response.fromSuccess());
        else
            return Promise.resolve(rest.Response.fromUnknownError());
    }, error => {
        return Promise.resolve(rest.Response.fromUnknownError('Post not Liked', 'Post not liked'));
    });
}
