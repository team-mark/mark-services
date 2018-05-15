import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest, cryptoLib } from '@mark/utils';
import { auth } from '@mark/data-utils';

const { authBasic, authAnon, notAllowed } = auth;
// Routes
router.route('/login')
    .post(authBasic, login)
    .all(notAllowed);
router.route('/signup')
    .post(authAnon, login)
    .all(notAllowed);
router.route('/signup-validate')
    .post(authAnon, login)
    .all(notAllowed);
router.route('/check-handle-availability')
    .post(authAnon, checkHandleAvailability)
    .all(notAllowed);
router.route('/get-token')
    .post(authAnon, getToken)
    .all(notAllowed);

// Route definitions
function login(req: express.Request, res: express.Response, next: express.NextFunction): void {
    res.send({ username: 'ferrantejake' });
}

function checkHandleAvailability(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    const { handle } = req.query;
    return db.users.checkIfExists(handle)
        .then(exists => {
            if (exists) {
                return Promise.resolve(rest.RestResponse.fromSuccess(res));
            } else {
                return Promise.resolve(rest.RestResponse.fromNotFound(res));
            }
        });
}

function getToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    const { handle } = req.query;

    return cryptoLib.generateSecureCode(20)
        .then(code => Promise.resolve(rest.RestResponse.fromSuccess({ code })))
        .catch(error => Promise.resolve(rest.RestResponse.fromNotAllowed()));
}
