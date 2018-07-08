import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth, bots } from '@mark/data-utils';
import { mongoDb } from '@mark/db/lib/components';
import { IMarkDb } from '@mark/db/lib/models';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.route('/')
    .get(authBasic, verify, respond(listMarks))
    // .post(authBasic, verify, respond(createMark))
    // .put(authBasic, verify, respond(reviseMark))
    .all(notAllowed);

function listMarks(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
return null;
}

function markFetch(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    let { sort, skip, limit, ids } = req.query;
    const query: mongoDb.IFilter<IMarkDb>[] = [];

    sort = parseInt(sort);
    skip = parseInt(skip);
    limit = parseInt(limit);

    if (!limit)
        limit = 10;
    if (!skip)
        skip = 0;
    if (!sort)
        sort = 0;

    if (ids) {
        ids = JSON.parse(ids);
        // Aggregate pipeline ensures that array order is kept
        // when retrieving data
        query.push({
            $match: {
                ethereum_id: { $in: ids }
            }
        });
        query.push({
            $addFields: {
                __order: { $indexOfArray: [ids, '$ethereum_id'] }
            }
        });
        query.push({
            $sort: {
                __order: 1
            }
        });

        return db.marks.getMarksAggregate(query)
            .then(marks => {
                return Promise.resolve(rest.Response.fromSuccess(marks));
            });
    }

    return db.marks.getMarks(sort, skip, limit).then(marks => {
        return Promise.resolve(rest.Response.fromSuccess(marks));
    });
}

function markPost(req: express.Request, res: express.Response & auth.BasicAuthFields, next: express.NextFunction): Promise<rest.Response> {
    // add in input checks
    const { body, passwordh } = req.body;
    const { userRecord }: auth.BasicAuthFields = res.locals;

    if (!body)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'body required'));
    if (!passwordh)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'passwordh required'));

    return db.marks.create(body, userRecord, passwordh)
        .then(mark => Promise.resolve(rest.Response.fromSuccess({ mark: mark._id })));
}
