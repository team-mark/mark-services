import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { auth } from '@mark/data-utils';
import { rest } from '@mark/utils';
import { unwatchFile } from 'fs';
const debug = require('debug')('mark:users');

const { authBasic } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.route('/:handle')
    .get(authBasic, verify, respond(getAccount))
    .all(rest.notAllowed);
// router.route('/:handle/marks')
//     .get(authBasic, verify, respond(getAccount))
//     .all(rest.notAllowed);
// router.route('/:handle/marks/:id')
//     .get(authBasic, verify, respond(getAccount))
//     .all(rest.notAllowed);
router.route('/:handle/followers')
    .get(authBasic, verify, respond(listFollowers))
    .put(authBasic, verify, respond(addFollower))
    .all(rest.notAllowed);
router.route('/:handle/followers/:handle')
    .delete(authBasic, verify, respond(removeFollower))
    .all(rest.notAllowed);

// Route definitions
function getAccount(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    console.log('req.params users', req.params);
    const { handle } = req.params;
    return db.users.getByHandle(handle)
        .then(user => {
            if (user) {
                return Promise.resolve(rest.Response.fromSuccess(db.User.map(user)));
            } else {
                return Promise.resolve(rest.Response.fromNotFound({ handle }));
            }
        });
}

function listFollowers(req: express.Request & { user: db.IUserDb }, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { user } = req;

    return db.users.getFollowers(user.handle)
        .then(followers => {
            // const followers = {};
            return rest.Response.fromSuccess({ followers });
        });
}
function removeFollower(req: express.Request & { user: db.IUserDb }, res: express.Response, next: express.NextFunction): Promise<rest.Response> {

    const { user } = req;
    const { handle: followerHandle } = req.params;
    const { handle: targetHandle } = user;

    return db.users.removeFollower(followerHandle, targetHandle)
        .then(() => rest.Response.fromSuccess());
}

function addFollower(req: express.Request & { user: db.IUserDb }, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { user } = req;
    const { handle: followerHandle } = req.params;
    const { handle: targetHandle } = user;

    return db.users.addFollower(followerHandle, targetHandle)
        .then(() => rest.Response.fromSuccess());
}