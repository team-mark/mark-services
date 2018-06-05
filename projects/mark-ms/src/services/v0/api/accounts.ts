import * as express from 'express';
const router = express.Router();
module.exports = router;
import * as db from '@mark/db';
import { rest } from '@mark/utils';
import { auth } from '@mark/data-utils';
import { authentication } from '../../../utils';
const debug = require('debug')('mark:accounts');

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.route('/login')
    .post(authBasic, verify, respond(login))
    .all(notAllowed);
router.route('/signup')
    .post(authAnon, verify, respond(signup))
    .all(notAllowed);
router.route('/signup-validate')
    .post(authAnon, verify, respond(signupValidate))
    .all(notAllowed);
router.route('/check-handle-availability')
    .post(authAnon, verify, respond(checkHandleAvailability))
    .all(notAllowed);

// Route definitions
function login(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // res.send({ username: 'ferrantejake' });
    return null;
}

function signup(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { handle, phone, passwordh } = req.query;
    return new Promise<rest.Response>((resolve, reject) => {

        db.accounts.existsByPhoneHash(phone)
            .then(exists => {
                if (exists) {
                    // user already registered, reject here
                } else {

                    const z_a = authentication.getZ_a(accountId, phoneh, handle, passwordh);
                    
                    // create z_a

                    // respond with state, PAD(salt) = blake2(accountId, handle, passwordh)
                    // link_a will be
                    // sms code\

                    db.accounts.existsByPhoneHash
                }
            })
            .catch((errorOrResponse: Error | rest.Response) => {
                if ((errorOrResponse as Object).constructor === Error) {
                    // error type, response with 500;
                    debug(errorOrResponse);
                    resolve(rest.Response.fromServerError());
                } else {
                    // planned rejection, respond with rejection
                    resolve(errorOrResponse as rest.Response);
                }
            });

    });
}

function signupValidate(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // res.send({ username: 'ferrantejake' });
    return null;
}

function checkHandleAvailability(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { handle } = req.body;
    return db.users.checkIfExists(handle)
        .then(exists => {
            if (exists) {
                return rest.Response.fromSuccess();
            } else {
                return rest.Response.fromNotFound();
            }
        });
}

// function getToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.RestResponse> {
//     const { handle } = req.query;

//     return cryptoLib.generateSecureCode(20)
//         .then(code => Promise.resolve(rest.RestResponse.fromSuccess({ code })))
//         .catch(error => Promise.resolve(rest.RestResponse.fromNotAllowed()));
// }
