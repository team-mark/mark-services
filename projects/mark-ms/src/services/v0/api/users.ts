import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as mdb from '@mark/mdb';
import { rest } from '@mark/utils';
import { unwatchFile } from 'fs';

const respond = rest.promiseResponseMiddlewareWrapper;

// Routes
router.get('/:handle', respond(getAccount));

// Route definitions
function getAccount(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    const { handle } = req.params;
    return mdb.users.getByHandle(handle)
        .then(user => {
            if (user) {
                return Promise.resolve(rest.RestResponse.fromSuccess(res, mdb.User.map(user)));
            } else {
                return Promise.resolve(rest.RestResponse.fromNotFound(res, { handle }));
            }
        });
}