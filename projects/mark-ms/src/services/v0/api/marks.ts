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
router.get('/', verify, respond(mark_dummy));

function mark_dummy(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    return db.marks.retrieve_marks().then(_marks => {
        console.log(_marks);
        const consumer = _marks.map(db.Mark.map);
        return Promise.resolve(rest.RestResponse.fromSuccess(consumer));
    });
}