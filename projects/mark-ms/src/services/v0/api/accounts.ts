import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as mdb from '@mark/mdb';
import { rest } from '@mark/utils';

const notAllowed = rest.notAllowed;

// Routes
router.get('/login', login);
router.get('/signup', login);
router.get('/signup-validate', login);
router.route('/check-handle-availability')
    .get()
    .all(notAllowed);

// Route definitions
function login(req: express.Request, res: express.Response, next: express.NextFunction): void {
    res.send({ username: 'ferrantejake' });
}

function checkHandleAvailability(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    const { handle } = req.query;
    return mdb.users.checkIfExists(handle)
        .then(exists => {
            if (exists) {
                return Promise.resolve(rest.RestResponse.fromSuccess(res));
            } else {
                return Promise.resolve(rest.RestResponse.fromNotFound(res));
            }
        });
}