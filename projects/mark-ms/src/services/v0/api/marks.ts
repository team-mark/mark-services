import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth, bots } from '@mark/data-utils';
import { IUserDb } from '@mark/db';
import { mongoDb } from '../../../../../@mark/db/lib/components';
import { IMarkDb } from '../../../../../@mark/db/lib/models';
import { newObjectId } from '../../../../../@mark/db/lib/components/mongoDb';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.get('/', verify, respond(markFetch));
router.post('/', authBasic, verify, respond(markPost));

function markFetch(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    let { sort, skip, size, ids} = req.query;
    const query: mongoDb.IFilter<IMarkDb>[] = [];

    sort = parseInt(sort);
    skip = parseInt(skip);
    size = parseInt(size);

    if (!size)
        size = 10;
    if (!skip)
        skip = 0;
    if (!sort)
        sort = 0;

    if (ids) {
        ids = JSON.parse(ids);
        // Aggregate pipeline ensures that array order is kept
        // when retrieving data
        query.push({$match: {
            ethereum_id: {$in: ids}
        }});
        query.push({$addFields: {
            __order: {$indexOfArray: [ids, '$ethereum_id']}
        }});
        query.push({$sort: {
            __order: 1
        }});
        return db.marks.getMarksAggregate(query)
            .then(marks => {
                return Promise.resolve(rest.Response.fromSuccess(marks));
            });
    }

    return db.marks.getMarks(sort, skip, size).then(marks => {
        return Promise.resolve(rest.Response.fromSuccess(marks));
    });
}

function markPost(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // add in input checks
    const { body } = req.body;

    return db.marks.postMark(body, res.locals.owner)
        .then(result => {
            if (result)
                return Promise.resolve(rest.Response.fromSuccess());
            else
                return Promise.resolve(rest.Response.fromUnknownError());
        });
}
