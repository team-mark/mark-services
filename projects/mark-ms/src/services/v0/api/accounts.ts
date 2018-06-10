import * as async from 'async';
import * as db from '@mark/db';
import * as express from 'express';
import { auth, redisConnect } from '@mark/data-utils';
import { sns } from '../../../utils';
import { cryptoLib, rest, authentication } from '@mark/utils';
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
    debug('signup', req.query);
    // 1.   Get hashes of items
    // 2.   Check to see if phone is registered, handle is taken
    // 3.   Create acccount and account info
    const { handle, phone, passwordh } = req.body;

    // phone numbers between 11-13 characters, includes country code.
    const PHONE_REGEX = /\d{11,13}/;

    if (!handle)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'handle required'));
    if (!phone || !PHONE_REGEX.test(phone))
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'valid phone required'));
    if (!passwordh)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'passwordh required'));

    let phoneh: string;
    let passh: string;
    let refA: string;

    return Promise.all([
        cryptoLib.hashPhone(phone),
        cryptoLib.hashPassword(passwordh)
    ])
        .then(([phoneHash, passHash]) => {
            debug('phoneHash', phoneHash);
            debug('passHash', passHash);
            // for local state
            phoneh = phoneHash;
            passh = passHash;

            return Promise.all([
                db.users.existsByPhoneHash(phone),
                db.users.existsByHandle(handle)
            ]);
        })
        .then(([userExists, handleExists]) => {
            debug('user, handle exists ? ', userExists, handleExists);
            if (handleExists) {
                return Promise.reject(rest.Response.fromBadRequest('handle_taken', `Handle \`${handle}\` already registered`));
            }
            if (userExists) {
                return Promise.reject(rest.Response.fromBadRequest('user_registered', 'User already registered'));
            }

            const PAD = authentication.getPAD(handle, passwordh);
            const userId = db.newObjectId().toHexString();
            debug('PAD', PAD);
            debug('userId', userId);

            return Promise.all([
                authentication.getLinkR(handle, passwordh),
                authentication.getRefA(userId, handle, passwordh),
                authentication.getLinkPK(userId, handle, passwordh)
            ])
                .then(([linkR, _refA, linkPK]) => {
                    refA = _refA;
                    debug('linkR', linkR);
                    debug('refA', refA);
                    const linkI = authentication.getLinkI(linkR, refA);
                    return db.users.create(userId, handle, linkR, refA, linkI, linkPK);
                })
                .then(accountRecord => {
                    const { address: walletAddress } = accountRecord;

                    return authentication.getRefI(refA, walletAddress, passh)
                        .then(refI => {

                            return Promise.all([
                                db.accountInfo.create(phoneh, refI),
                                redisConnect.instance(),
                                cryptoLib.generateSecureCode(18),
                                cryptoLib.generateShortCode(6),
                                cryptoLib.generateShortCode(6)
                            ]);
                        })
                        .then(([accountInfoRecord, redisClient, state, roll1, code]) => {

                            // state, code to decimal
                            // multiple values
                            // accountInfoKey = hash(accountId, handle) walk (roll3 times)

                            const accountInfoKey = `signup:accountInfo:${state}.${code}`;

                            let roll1Mod = parseInt(roll1) % 100;
                            let roll2Mod = parseInt(code) % 100;
                            if (roll1Mod === 0) {
                                roll1Mod = parseInt(roll1) % roll2Mod;
                            }
                            if (roll2Mod === 0) {
                                roll2Mod = parseInt(code) % roll1Mod;
                            }

                            const roll3 = roll1Mod * roll2Mod;

                            const kid = cryptoLib.hashKid(userId, roll3);
                            const accountKey = `signup:account:${kid}`;

                            const accountInfoData = JSON.stringify({
                                userId,
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

                                        cryptoLib.hash(userId, authentication.DEFAULT_HASH_RATE, handle)
                                            .then(pad => {
                                                const responseBody = {
                                                    pad,
                                                    roll: roll1,
                                                    state,
                                                    code
                                                };
                                                resolve(rest.Response.fromSuccess(responseBody));
                                            });

                                        // sns.sendCode(phone, code)
                                        //     .then(response => {

                                        //         cryptoLib.hash(accountId, authentication.DEFAULT_HASH_RATE, handle)
                                        //             .then(pad => {
                                        //                 const responseBody = {
                                        //                     pad,
                                        //                     roll: roll1,
                                        //                     state,
                                        //                 };
                                        //                 resolve(rest.Response.fromSuccess(responseBody));
                                        //             });

                                        //     })
                                        //     .catch(reject);
                                    });
                                });
                            });
                        });
                });
        })
        .catch((errorOrResponse: Error | rest.Response) => {
            debug('errorOrResponse', errorOrResponse);
            if ((errorOrResponse as Object).constructor === Error) {
                // error type, response with 500;
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
