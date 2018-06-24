import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth, bots } from '@mark/data-utils';
import { IUserConsumer } from '@mark/db';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.get('/', authBasic, verify, respond(likeFetch));
router.post('/', authBasic, verify, respond(likePost));

function likeFetch(req: express.Request  & { user: IUserConsumer }, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { user } = req;
    return db.likes.getUsersLikes(user.handle).then(likes => {
        return Promise.resolve(rest.Response.fromSuccess(likes));
    });
}

function likePost(req: express.Request & {user: IUserConsumer}, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { user } = req;
    const { postId } = req.body;

    return db.likes.addLike(postId, user.handle)
        .then(result => {
            if (result)
                return Promise.resolve(rest.Response.fromSuccess());
            else
                return Promise.resolve(rest.Response.fromUnknownError());
        }, rejected => {
            return Promise.resolve(rest.Response.fromBadRequest('code', 'mark already liked'));
        });
}
