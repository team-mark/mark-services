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
    .get(authBasic, verify, respond(getAccount));

// Route definitions
function getAccount(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    console.log('req.params users', req.params);
    const { handle } = req.params;
    return db.users.getByHandle(handle)
        .then(user => {
            if (user) {
                return Promise.resolve(rest.RestResponse.fromSuccess(db.User.map(user)));
            } else {
                return Promise.resolve(rest.RestResponse.fromNotFound({ handle }));
            }
        });
}