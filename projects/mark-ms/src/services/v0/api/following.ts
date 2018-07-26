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
    .get(authBasic, verify, respond(listFollowing))
    .all(notAllowed);

function listFollowing(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord } = res.locals;

    return db.users.getFollowing(userRecord.handle)
        .then(following => {
            // const followers = {};
            return rest.Response.fromSuccess({ items: following });
        });
}