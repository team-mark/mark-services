import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth } from '@mark/data-utils';

const { authBasic, authAnon, notAllowed } = auth;

const respond = rest.promiseResponseMiddlewareWrapper;

// Routes
router.get('/:handle', respond(mark_dummy));

function mark_dummy(req: express.Request, res: express.Response, next: express.NextFunction) : Promise<rest.RestResponse>  {
    return Promise.resolve(rest.RestResponse.fromSuccess(null));
}