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
    .get(authBasic, verify, respond(searchbar))
    .all(notAllowed);

// Route definitions
function searchbar(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    console.log('req.params users', req.params);
    const { query } = req.query;

    return db.users.searchBarQuery(query)
        .then(users => {
            if (users) {
                return Promise.resolve(rest.Response.fromSuccess({ items: users.map(db.User.map) }));
            } else {
                return Promise.resolve(rest.Response.fromNotFound({ query }));
            }
        });
}
