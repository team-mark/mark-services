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
router.route('/login')
    .post(authBasic, verify, login)
    .all(notAllowed);
router.route('/signup')
    .post(authAnon, verify, login)
    .all(notAllowed);
router.route('/signup-validate')
    .post(authAnon, verify, login)
    .all(notAllowed);
router.route('/check-handle-availability')
    .post(authAnon, verify, respond(checkHandleAvailability))
    .all(notAllowed);
router.route('/get-token')
    .post(authAnon, verify, getToken)
    .all(notAllowed);

// Route definitions
function login(req: express.Request, res: express.Response, next: express.NextFunction): void {
    res.send({ username: 'ferrantejake' });
}

function checkHandleAvailability(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    const { handle } = req.body;
    return db.users.checkIfExists(handle)
        .then(exists => {
            if (exists) {
                return rest.RestResponse.fromSuccess();
            } else {
                return rest.RestResponse.fromNotFound();
            }
        });
}

function getToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
    const { handle } = req.query;

    return cryptoLib.generateSecureCode(20)
        .then(code => rest.RestResponse.fromSuccess({ code }))
        .catch(error => rest.RestResponse.fromNotAllowed());
}
