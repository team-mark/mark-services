import * as async from 'async';
import * as db from '@mark/db';
import * as express from 'express';
import { auth, redisConnect } from '@mark/data-utils';
import { authentication, sns } from '../../../utils';
import { cryptoLib, rest } from '@mark/utils';
const router = express.Router();
const debug = require('debug')('mark:accounts');
module.exports = router;

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
/**
 *
 * @param req
 * @param res
 * @param next
 * references: https://en.wikipedia.org/wiki/PBKDF2
 */
function signup(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // 1.   Get hashes of items
    // 2.   Check to see if phone is registered, handle is taken
    // 3.   Create acccount and account info
    const { handle, phone, passwordh } = req.query;
    // return new Promise<rest.Response>((resolve, reject) => {

    let phoneh: string;
    let passh: string;

    return Promise.all([
        cryptoLib.hashPhone(phone),
        cryptoLib.hashPassword(passwordh)
    ])
        .then(([phoneHash, passHash]) => {
            // for local state
            phoneh = phoneHash;
            passh = passHash;

            return Promise.all([
                db.accounts.existsByPhoneHash(phone),
                db.accounts.existsByHandle(handle)
            ]);
        })
        .then(([userExists, handleExists]) => {
            if (handleExists) {
                return Promise.reject(rest.Response.fromBadRequest('Username already registered'));
            }
            if (userExists) {
                return Promise.reject(rest.Response.fromBadRequest('User already registered'));
            }

            const PAD = authentication.getPAD(handle, passwordh);

            return authentication.getLinkR(handle, passwordh)
                .then(linkR => db.accounts.create(handle, linkR));
        })
        .then(accountRecord => {
            const { _id, address: walletAddress } = accountRecord;
            const accountId = _id.toHexString();

            return authentication.getRefA(accountId, phoneh, handle, passh)
                .then(refA => {
                    return authentication.getRefI(refA, walletAddress, passh)
                        .then(refI => {
                            const accountModifications: Partial<db.IAccountDb> = {
                                refA
                            };

                            return Promise.all([
                                db.accounts.updateAccount(_id, accountModifications),
                                db.accountInfo.create(phoneh, refI),
                                redisConnect.instance(),
                                cryptoLib.generateSecureCode(18),
                                cryptoLib.generateHexCode(6),
                                cryptoLib.generateHexCode(6)
                            ]);
                        });
                });
        })
        .then(([accountRecord, accountInfoRecord, redisClient, state, roll1, code]) => {

            // state, code to decimal
            // multiple values
            // accountInfoKey = hash(accountId, handle) walk (roll3 times)

            const accountInfoKey = `signup:accountInfo:${state}.${code}`;
            const accountId = accountRecord._id.toHexString();

            let roll1Mod = parseInt(roll1) % 100;
            let roll2Mod = parseInt(code) % 100;
            if (roll1Mod === 0) {
                roll1Mod = parseInt(roll1) % roll2Mod;
            }
            if (roll2Mod === 0) {
                roll2Mod = parseInt(code) % roll1Mod;
            }

            const roll3 = roll1Mod * roll2Mod;

            const kid = cryptoLib.hashKid(accountId, roll3);
            const accountKey = `signup:account:${kid}`;

            const accountInfoData = JSON.stringify({
                accountInfoId: accountInfoRecord._id,
                phoneh,
                roll2: code
            });

            const accountData = JSON.stringify({
                handle,
                passwordh,
            });

            return new Promise<rest.Response>((resolve, reject) => {
                async.parallel([
                    cb =>
                        redisClient.get(accountInfoKey, (error: Error, reply: string) => {
                            if (error) {
                                cb(error);
                            } else {
                                cb(null, reply);
                            }
                        }),
                    cb =>
                        redisClient.get(accountKey, (error: Error, reply: string) => {
                            if (error) {
                                cb(error);
                            } else {
                                cb(null, reply);
                            }
                        }),

                ], (error: Error, [accountInfoReply, accountReply]: string[]) => {

                    if (error || accountInfoReply !== null || accountReply !== null) {
                        // state/code values collide with another signup session's
                        // state/code values. Ask to try again.
                        debug('error', error);
                        debug('get: accountInfoReply', accountInfoReply);
                        debug('get: accountReply', accountReply);
                        return reject(rest.Response.fromServerError());
                    }

                    // otherwise the values are open. continue.

                    const signupTimeout = 3 * 60; // 3 * 60 seconds = 3 minutes

                    async.parallel([
                        cb =>
                            redisClient.setex(accountInfoKey, signupTimeout, accountInfoData, (error: Error, reply: string) => {
                                if (error) {
                                    cb(error);
                                } else {
                                    cb(null, reply);
                                }
                            })
                        ,
                        cb =>
                            redisClient.setex(accountKey, signupTimeout, accountData, (error: Error, reply: string) => {
                                if (error) {
                                    cb(error);
                                } else {
                                    cb(null, reply);
                                }
                            })

                    ], (error: Error, [accountInfoReply, accountReply]: string[]) => {

                        if (error || accountInfoReply !== 'OK' || accountReply !== 'OK') {
                            // Something went wrong here. These should be 'OK'
                            debug('error', error);
                            debug('get: accountInfoReply', accountInfoReply);
                            debug('get: accountReply', accountReply);
                            return reject(rest.Response.fromServerError());
                        }

                        sns.sendCode(phone, code)
                            .then(response => {

                                cryptoLib.hash(accountId, 111, handle)
                                    .then(pad => {
                                        const responseBody = {
                                            pad,
                                            roll: roll1,
                                            state,
                                        };
                                        resolve(rest.Response.fromSuccess(responseBody));
                                    });

                            })
                            .catch(reject);
                    });

                });
            });
        })
        .catch((errorOrResponse: Error | rest.Response) => {
            if ((errorOrResponse as Object).constructor === Error) {
                // error type, response with 500;
                debug(errorOrResponse);
                return Promise.resolve(rest.Response.fromServerError());
            } else {
                // planned rejection, respond with rejection
                return Promise.resolve(errorOrResponse as rest.Response);
            }
        });
}

function signupValidate(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // res.send({ username: 'ferrantejake' });
    const { key, roll, state, secret: deviceSecret } = req.body;

    // const refT = authentication.getRefT(handle, passwordh, deviceSecret);

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
