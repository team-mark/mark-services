import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { auth } from '@mark/data-utils';
import { rest } from '@mark/utils';
import { unwatchFile } from 'fs';
const debug = require('debug')('mark:followers');

const { authBasic, authAnon } = auth;
const { verify, notAllowed } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

router.route('/')
    .get(authBasic, verify, respond(listFollowers))
    .all(notAllowed);
router.route('/:handle')
    .get(authBasic, verify, respond(listUserFollowers))
    .put(authBasic, verify, respond(addFollower))
    .delete(authBasic, verify, respond(removeFollower))
    .all(notAllowed);

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

function listFollowers(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord } = res.locals;

    return db.users.getFollowers(userRecord.handle)
        .then(followers => {
            // const followers = {};
            return rest.Response.fromSuccess({ items: db.User.map(followers as any) });
        });
}

function listUserFollowers(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { handle } = req.params;

    if (!handle) {
        return Promise.resolve(rest.Response.fromBadRequest('handle_required', 'no handle provided'));
    }

    return db.users.getFollowers(handle)
        .then(followers => {
            // const followers = {};
            return rest.Response.fromSuccess({ items: followers });
        });
}

function removeFollower(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {

    const { userRecord } = res.locals;
    const { handle: following } = req.params;
    const { handle: owner } = userRecord;

    return db.users.removeFollower(owner, following)
        .then(() => rest.Response.fromSuccess());
}

function addFollower(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord } = res.locals;
    const { handle: following } = req.params;
    const { handle: owner } = userRecord;

    if (following === owner) {
        return Promise.resolve(rest.Response.fromBadRequest('invalid_follower', 'user and target can not be the same'));
    }

    return db.users.addFollower(owner, following)
        .then(() => rest.Response.fromSuccess())
        .catch(error => {
            const INDEX_CONFLICT = 11000; // record already exists
            if (error.code === INDEX_CONFLICT) {
                return Promise.resolve(rest.Response.fromBadRequest('invalid_follower', 'follower already exists'));
            }
            return Promise.reject(error);
        });
}