import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth } from '@mark/data-utils';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.get('/', verify, respond(markFetch));
router.post('/', verify, respond(markPost));

function markFetch(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    return db.marks.retrieveMarks().then(marks => {
        return Promise.resolve(rest.Response.fromSuccess(marks));
    });
}

function markPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // add in input checks
    const {body} = req.body;
    return db.marks.postMark(body)
        .then(result => {
            if (result)
                return Promise.resolve(rest.Response.fromSuccess());
            else
                return Promise.resolve(rest.Response.fromServerError());
        });
}
