import * as async from 'async';
import * as db from '@mark/db';
import * as express from 'express';
import { auth, redisConnect, token } from '@mark/data-utils';
import { sns, s3 } from '../../../utils';
import { authentication, cryptoLib, rest } from '@mark/utils';
import * as STATUS from 'http-status';
import * as multer from 'multer';
import { IUserDb } from '@mark/db';

const UPLOAD_PATH = 'uploads';
const upload = multer({ dest: `${UPLOAD_PATH}/` }); // multer configuration

const router = express.Router();
const debug = require('debug')('mark:accounts');
module.exports = router;

const { authBasic, authAnon, notAllowed } = auth;
const { verify } = rest;
const respond = rest.promiseResponseMiddlewareWrapper(debug);

// Routes
router.route('/info')
    .get(authBasic, verify, respond(info))
    .all(notAllowed);
router.route('/login')
    .post(authAnon, verify, respond(login))
    .all(notAllowed);
router.route('/logout')
    .post(authAnon, verify, respond(logout))
    .all(notAllowed);
router.route('/check-handle-availability')
    .post(authAnon, verify, respond(checkHandleAvailability))
    .all(notAllowed);
router.route('/signup')
    .post(authAnon, verify, respond(signup))
    .all(notAllowed);
router.route('/signup-validate')
    .post(authAnon, verify, respond(signupValidate))
    .all(notAllowed);
router.route('/update-profile-picture')
    .post(authBasic, verify, upload.single('profile-picture'), respond(uploadProfilePicture))
    .all(notAllowed);

// Route definitions

function logout(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // const { tokenRecord } = res.locals as auth.BasicAuthFields;

    const token = req.get('Authorization');
    console.log(res.locals);

    if (!token)
        return Promise.resolve(rest.Response.fromSuccess());

    return db.tokens.deletebyToken(token)
        .then(deleteResult => {
            if (deleteResult.result.ok) {
                return Promise.resolve(rest.Response.fromSuccess());
            }
        });
}
function login(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { handle, passwordh, key: OTP } = req.body;
    let userRecord: db.IUserDb;

    if (!handle)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'handle required'));
    if (!passwordh)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'passwordh required'));
    if (!OTP)
        return Promise.resolve(rest.Response.fromBadRequest('field_required', 'key required'));

    debug('login:', handle, passwordh);

    return Promise.all([
        db.users.getByHandle(handle),
        cryptoLib.hashPassword(passwordh)
    ])
        .then(([_userRecord, passHash]) => {
            if (!_userRecord) {
                return Promise.reject(rest.Response.fromNotFound());
            }
            userRecord = _userRecord;

            debug('userRecord', userRecord);
            const { refU, address, _id } = userRecord;
            const userId = _id.toHexString();

            return authentication.getRefI(refU, address, passHash);
        })
        .then(refI => {
            debug('refI', refI);
            return db.accountInfo.existsByRefI(refI);
        })
        .then(exists => {
            if (exists) {

                const { refU, address, _id } = userRecord;
                const userId = _id.toHexString();

                return Promise.all([
                    authentication.getLinkQ(handle, passwordh, OTP),
                    authentication.getRefU(userId, handle, passwordh)
                ])
                    .then(([linkQ, refU]) => {
                        return Promise.all([
                            authentication.getRefT(handle, passwordh, OTP),
                            authentication.getLinkA(linkQ, refU)
                        ]);
                    })
                    .then(([refT, linkA]) => {
                        return db.tokens.whitelist(refT, linkA, handle);
                    });
            } else {
                return Promise.reject(rest.Response.fromBadRequest('invalid_login', 'invalid handle or password'));
            }
        })
        .then(tokenRecord => {
            debug('created token', tokenRecord.token);

            const response = rest.Response.fromSuccess(db.Token.mapForConsumer(tokenRecord));
            return Promise.resolve(response);
        })
        .catch((errorOrResponse: Error | rest.Response) => {
            debug('errorOrResponse', errorOrResponse);
            if ((errorOrResponse as Object).constructor === Error) {
                // error type, response with 500;
                return Promise.resolve(rest.Response.fromUnknownError());

            } else {
                // planned rejection, respond with rejection
                if ((errorOrResponse as rest.Response).status === STATUS.INTERNAL_SERVER_ERROR) {

                    return Promise.resolve(rest.Response.fromUnknownError());
                } else {
                    return Promise.resolve(errorOrResponse as rest.Response);
                }
            }
        });

}
/**
 *
 * @param req
 * @param res
 * @param next
 * references: https://en.wikipedia.org/wiki/PBKDF2
 */
function info(req: express.Request & { user: IUserDb }, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { userRecord } = res.locals;
    return Promise.resolve(rest.Response.fromSuccess(db.User.map(userRecord)));
}
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
    let refU: string;
    let linkR: string;

    return cryptoLib.generateSecureCode(cryptoLib.AUTH_CODE_CHARS, 24, true)
        .then(state => {

            return Promise.all([
                cryptoLib.hashPhone(phone),
                cryptoLib.hashPassword(passwordh),
            ])
                .then(([phoneHash, passHash]) => {
                    debug('phoneHash', phoneHash);
                    debug('passHash', passHash);
                    // for local state
                    phoneh = phoneHash;
                    passh = passHash;

                    return Promise.all([
                        db.accountInfo.existsByPhoneHash(phoneh),
                        db.users.existsByHandle(handle)
                    ]);
                })
                .then(([accountExists, userExists]) => {
                    debug('user, handle exists ? ', accountExists, userExists);
                    if (userExists) {
                        return Promise.reject(rest.Response.fromBadRequest('handle_taken', `Handle \`${handle}\` already registered`));
                    }
                    if (accountExists) {
                        return Promise.reject(rest.Response.fromBadRequest('user_registered', 'User already registered'));
                    }

                    const userId = db.User.mapId(db.newObjectId());

                    debug('userId', userId);

                    return Promise.all([
                        authentication.getLinkR(handle, passwordh),
                        authentication.getRefU(userId, handle, passwordh),
                        authentication.getLinkPK(userId, handle, passwordh)
                    ])
                        .then(([_linkR, _refA, linkPK]) => {
                            refU = _refA;
                            linkR = _linkR;
                            debug('linkR', linkR);
                            debug('refA', refU);
                            return db.users.create(userId, handle, refU, linkPK, state);
                        })
                        .then(userRecord => {
                            const { address: walletAddress } = userRecord;

                            return authentication.getRefI(refU, walletAddress, passh)
                                .then(refI => {

                                    const linkI = authentication.getLinkI(linkR, refI);
                                    const modifications = {
                                        ...userRecord,
                                        linkI
                                    };

                                    return Promise.all([
                                        db.users.updateById(userId, modifications),
                                        db.accountInfo.create(phoneh, refI, state),
                                        redisConnect.instance(),
                                        cryptoLib.generateShortCode(6, cryptoLib.Encoding.hex),
                                        cryptoLib.generateShortCode(6, cryptoLib.Encoding.hex),
                                        cryptoLib.generateShortCode(6, cryptoLib.Encoding.hex)
                                    ]);
                                })
                                .then(([_userRecord, accountInfoRecord, redisClient, roll1, roll2, code]) => {

                                    // state, code to decimal
                                    // multiple values
                                    // accountInfoKey = hash(accountId, handle) walk (roll3 times)

                                    const accountInfoKey = `signup:accountInfo:${state}.${code}`;
                                    const accountInfoId = db.AccountInfo.mapId(accountInfoRecord._id);

                                    let roll1Mod = parseInt(roll1, 16) % 100;
                                    let roll2Mod = parseInt(roll2, 16) % 100;
                                    if (roll1Mod === 0) {
                                        roll1Mod = parseInt(roll1, 16) % roll2Mod;
                                    }
                                    if (roll2Mod === 0) {
                                        roll2Mod = parseInt(roll2, 16) % roll1Mod;
                                    }

                                    const roll3 = roll1Mod * roll2Mod;

                                    return cryptoLib.hashKid(accountInfoId, roll3)
                                        .then(kid => {

                                            const accountKey = `signup:account:${kid}`;

                                            const accountInfoData = JSON.stringify({
                                                accountInfoId,
                                                phoneh,
                                                roll2
                                            });

                                            const accountData = JSON.stringify({
                                                userId,
                                                handle,
                                                passwordh,
                                            });

                                            return new Promise<rest.Response>((resolve, reject) => {
                                                async.parallel([
                                                    (cb: (error: Error, reply?: any) => any) =>
                                                        redisClient.get(accountInfoKey, (error: Error, reply: string) => {
                                                            if (error) {
                                                                cb(error);
                                                            } else {
                                                                cb(null, reply);
                                                            }
                                                        }),
                                                    (cb: (error: Error, reply?: any) => any) =>
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
                                                        return reject(rest.Response.fromUnknownError());
                                                    }

                                                    // otherwise the values are open. continue.

                                                    const signupTimeout = 3 * 60; // 3 * 60 seconds = 3 minutes

                                                    async.parallel([
                                                        (cb: (error: Error, reply?: any) => any) =>
                                                            redisClient.setex(accountInfoKey, signupTimeout, accountInfoData, (error: Error, reply: string) => {
                                                                if (error) {
                                                                    cb(error);
                                                                } else {
                                                                    cb(null, reply);
                                                                }
                                                            })
                                                        ,
                                                        (cb: (error: Error, reply?: any) => any) =>
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
                                                            return reject(rest.Response.fromUnknownError());
                                                        }

                                                        // cryptoLib.hash(userId, authentication.DEFAULT_HASH_RATE, handle)
                                                        //     .then(pad => {
                                                        //         const responseBody = {
                                                        //             pad,
                                                        //             roll: roll1,
                                                        //             state,
                                                        //             code
                                                        //         };
                                                        //         resolve(rest.Response.fromSuccess(responseBody));
                                                        //     });

                                                        sns.sendCode(phone, code)
                                                            .then(response => {

                                                                // cryptoLib.hash(userId, authentication.DEFAULT_HASH_RATE, handle)
                                                                //     .then(pad => {
                                                                const responseBody = {
                                                                    // pad,
                                                                    roll: roll1,
                                                                    state,
                                                                };
                                                                resolve(rest.Response.fromSuccess(responseBody));
                                                                // });

                                                            })
                                                            .catch(reject);
                                                    });
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
                        return Promise.all([
                            db.users.deleteByState(state),
                            db.accountInfo.deleteByState(state),
                            db.tokens.deleteByState(state),
                        ])
                            .then(() => Promise.resolve(rest.Response.fromUnknownError()))
                            .catch(() => Promise.resolve(rest.Response.fromUnknownError()));

                    } else {
                        // planned rejection, respond with rejection
                        if ((errorOrResponse as rest.Response).status === STATUS.INTERNAL_SERVER_ERROR) {

                            return Promise.all([
                                db.users.deleteByState(state),
                                db.accountInfo.deleteByState(state),
                                db.tokens.deleteByState(state),
                            ])
                                .then(() => Promise.resolve(rest.Response.fromUnknownError()))
                                .catch(() => Promise.resolve(rest.Response.fromUnknownError()));
                        } else {
                            return Promise.resolve(errorOrResponse as rest.Response);
                        }
                    }
                });
        });
}

function signupValidate(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    // res.send({ username: 'ferrantejake' });
    const { key, roll: roll1, state, code } = req.body;

    // const refT = authentication.getRefT(handle, passwordh, deviceSecret);

    // state, code to decimal
    // multiple values
    // accountInfoKey = hash(accountId, handle) walk (roll3 times)

    const accountInfoKey = `signup:accountInfo:${state}.${code}`;
    // let

    return new Promise((resolve, reject) => {

        Promise.all([
            cryptoLib.hashDeviceSecret(key),
            redisConnect.instance()
        ])
            .then(([hashedKey, redisClient]) => {

                debug(hashedKey, 'hashedKey');
                debug(accountInfoKey, 'accountInfoKey');

                redisClient.get(accountInfoKey, (error: Error, reply: string) => {
                    if (error) {
                        return resolve(rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                    }
                    if (!reply) {
                        return resolve(rest.Response.fromBadRequest('invalid_session', 'could not identify signup session'));
                    }

                    let accountInfo: { accountInfoId: string, roll2: string, phoneh: string };
                    try {
                        accountInfo = JSON.parse(reply);
                    } catch (e) {
                        debug(e);
                        return resolve(rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                    }

                    let roll1Mod = parseInt(roll1, 16) % 100;
                    let roll2Mod = parseInt(accountInfo.roll2, 16) % 100;
                    if (roll1Mod === 0) {
                        roll1Mod = parseInt(roll1, 16) % roll2Mod;
                    }
                    if (roll2Mod === 0) {
                        roll2Mod = parseInt(accountInfo.roll2, 16) % roll1Mod;
                    }

                    const roll3 = roll1Mod * roll2Mod;

                    return cryptoLib.hashKid(accountInfo.accountInfoId, roll3)
                        .then(kid => {

                            const accountKey = `signup:account:${kid}`;

                            // const accountInfoData = JSON.stringify({
                            //     accountInfoId,
                            //     phoneh,
                            //     roll2: code
                            // });

                            // const accountData = JSON.stringify({
                            //     handle,
                            //     passwordh,
                            // });

                            // async.parallel([
                            //     cb =>
                            //         redisClient.get(accountInfoKey, (error: Error, reply: string) => {
                            //             if (error) {
                            //                 cb(error);
                            //             } else {
                            //                 cb(null, reply);
                            //             }
                            //         }),
                            //     cb =>
                            //         redisClient.get(accountKey, (error: Error, reply: string) => {
                            //             if (error) {
                            //                 cb(error);
                            //             } else {
                            //                 cb(null, reply);
                            //             }
                            //         }),

                            // ], (error: Error, [accountInfoReply, accountReply]: string[]) => {

                            // });

                            redisClient.get(accountKey, (error: Error, reply: string) => {
                                if (error) {
                                    debug(error);
                                    return resolve(rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                                }
                                if (!reply) {
                                    return resolve(rest.Response.fromBadRequest('invalid_session', 'could not identify signup session'));
                                }

                                // return resolve(rest.Response.fromServerError('internal_error', 'unable to service request'));

                                let accountInfo: { userId: string, handle: string, passwordh: string };
                                try {
                                    accountInfo = JSON.parse(reply);
                                } catch (e) {
                                    debug(e);
                                    return resolve(rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                                }
                                const { userId, handle, passwordh } = accountInfo;

                                Promise.all([
                                    authentication.getRefT(handle, passwordh, hashedKey),
                                    authentication.getLinkQ(handle, passwordh, hashedKey),
                                    authentication.getRefU(userId, handle, passwordh)
                                ])
                                    .then(([refT, linkQ, refU]) => {
                                        const linkA = authentication.getLinkA(linkQ, refU);

                                        db.tokens.whitelist(refT, linkA, handle)
                                            .then(authToken => {

                                                db.users.fundUserAccount(handle)
                                                    .then(() => resolve(rest.Response.fromSuccess({ token: authToken.token })))
                                                    .catch(reject);
                                            });
                                    });

                            });

                        });

                });

            })
            .catch(error => {
                debug(error);
            });
    });
}

function checkHandleAvailability(req: express.Request, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { handle } = req.body;
    return db.users.existsByHandle(handle)
        .then(exists => {
            if (exists) {
                return rest.Response.fromSuccess();
            } else {
                return rest.Response.fromNotFound();
            }
        });
}

export type MulterFile = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
};

function uploadProfilePicture(req: express.Request & { file: s3.MulterFile, user: db.IUserDb }, res: express.Response, next: express.NextFunction): Promise<rest.Response> {
    const { file, user } = req;
    const { handle } = user;

    return s3.uploadFile(file)
        .then(fileUrl => db.users.updateProfilePicture(handle, fileUrl)
            .then(() => rest.Response.fromSuccess({ url: fileUrl }))
        );
}
