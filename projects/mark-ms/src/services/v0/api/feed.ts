import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest } from '@mark/utils';
import { auth } from '@mark/data-utils';
const debug = require('debug')('mark:feed');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.route('/')
    .get(authBasic, verify, respond(listFeed))
    .all(notAllowed);

function listFeed(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { options } = req.query;
    const { userRecord } = res.locals;
    const { handle } = userRecord;

    let opts: {
        limit?: number,
        nextDirection?: '$gte' | '$lte',
        nextField?: string,
        nextId?: string
    };

    if (options) {
        opts = new Buffer(options, 'base64').toString() as any;
    } else {
        opts = {
            limit: 100
        };
    }

    return db.marks.listFeed(handle, opts)
        .then(markItems => {
            debug('items', markItems);
            const { items, nextId } = markItems;
            const nextObject = {
                nextId,
                nextField: '_id',
                nextDirection: '$gte',
                limit: opts.limit
            };
            const nextObjectString = (nextObject as Object).toString();
            const next = new Buffer(nextObjectString).toString('base64');

            return rest.Response.fromSuccess({
                items,
                next
            });

        })
        .catch(error => {
            debug('error', error);
            console.log('error', error);
            return null;
        });
}
