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
router.get('/sort', authBasic, verify, respond(likesSorted));
router.get('/:id', authBasic, verify, respond(likesOnPost));
router.put('/', authBasic, verify, respond(likePost));
router.delete('/:id', authBasic, verify, respond(dislikePost));
// router.delete('/:id', authBasic)

function likesByUser(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.likes.getUsersLikes(res.locals.userRecord.handle)
        .then(likes => {
            return Promise.resolve(rest.Response.fromSuccess(likes));
    });
}

function likesSorted(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    let { sort, skip, size} = req.query;

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
    return db.likes.addLike(req.body.postId, userRecord.handle)
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
