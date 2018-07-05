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

router.route('/followers')
    .get(authBasic, verify, respond(listFollowers))
    .all(rest.notAllowed);
router.route('/followers/:handle')
    .put(authBasic, verify, respond(addFollower))
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

function listFollowers(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord } = res.locals;

    return db.users.getFollowers(userRecord.handle)
        .then(followers => {
            // const followers = {};
            return rest.Response.fromSuccess({ followers });
        });
}
function removeFollower(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {

    const { userRecord } = res.locals;
    const { handle: followerHandle } = req.params;
    const { handle: targetHandle } = userRecord;

    return db.users.removeFollower(followerHandle, targetHandle)
        .then(() => rest.Response.fromSuccess());
}

function addFollower(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord } = res.locals;
    const { handle: followerHandle } = req.params;
    const { handle: targetHandle } = userRecord;

    return db.users.addFollower(followerHandle, targetHandle)
        .then(() => rest.Response.fromSuccess());
}