"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const db = require("@mark/db");
const express = require("express");
const data_utils_1 = require("@mark/data-utils");
const utils_1 = require("../../../utils");
const utils_2 = require("@mark/utils");
const STATUS = require("http-status");
const multer = require("multer");
const UPLOAD_PATH = 'uploads';
const upload = multer({ dest: `${UPLOAD_PATH}/` });
const router = express.Router();
const debug = require('debug')('mark:accounts');
module.exports = router;
const { authBasic, authAnon, notAllowed } = data_utils_1.auth;
const { verify } = utils_2.rest;
const respond = utils_2.rest.promiseResponseMiddlewareWrapper(debug);
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
function logout(req, res, next) {
    const token = req.get('Authorization');
    console.log(res.locals);
    if (!token)
        return Promise.resolve(utils_2.rest.Response.fromSuccess());
    return db.tokens.deletebyToken(token)
        .then(deleteResult => {
        if (deleteResult.result.ok) {
            return Promise.resolve(utils_2.rest.Response.fromSuccess());
        }
    });
}
function login(req, res, next) {
    const { handle, passwordh, key: OTP } = req.body;
    let userRecord;
    if (!handle)
        return Promise.resolve(utils_2.rest.Response.fromBadRequest('field_required', 'handle required'));
    if (!passwordh)
        return Promise.resolve(utils_2.rest.Response.fromBadRequest('field_required', 'passwordh required'));
    if (!OTP)
        return Promise.resolve(utils_2.rest.Response.fromBadRequest('field_required', 'key required'));
    debug('login:', handle, passwordh);
    return Promise.all([
        db.users.getByHandle(handle),
        utils_2.cryptoLib.hashPassword(passwordh)
    ])
        .then(([_userRecord, passHash]) => {
        if (!_userRecord) {
            return Promise.reject(utils_2.rest.Response.fromNotFound());
        }
        userRecord = _userRecord;
        debug('userRecord', userRecord);
        const { refU, address, _id } = userRecord;
        const userId = _id.toHexString();
        return utils_2.authentication.getRefI(refU, address, passHash);
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
                utils_2.authentication.getLinkQ(handle, passwordh, OTP),
                utils_2.authentication.getRefU(userId, handle, passwordh)
            ])
                .then(([linkQ, refU]) => {
                return Promise.all([
                    utils_2.authentication.getRefT(handle, passwordh, OTP),
                    utils_2.authentication.getLinkA(linkQ, refU)
                ]);
            })
                .then(([refT, linkA]) => {
                return db.tokens.whitelist(refT, linkA, handle);
            });
        }
        else {
            return Promise.reject(utils_2.rest.Response.fromBadRequest('invalid_login', 'invalid handle or password'));
        }
    })
        .then(tokenRecord => {
        debug('created token', tokenRecord.token);
        const response = utils_2.rest.Response.fromSuccess(db.Token.mapForConsumer(tokenRecord));
        return Promise.resolve(response);
    })
        .catch((errorOrResponse) => {
        debug('errorOrResponse', errorOrResponse);
        if (errorOrResponse.constructor === Error) {
            return Promise.resolve(utils_2.rest.Response.fromUnknownError());
        }
        else {
            if (errorOrResponse.status === STATUS.INTERNAL_SERVER_ERROR) {
                return Promise.resolve(utils_2.rest.Response.fromUnknownError());
            }
            else {
                return Promise.resolve(errorOrResponse);
            }
        }
    });
}
function info(req, res, next) {
    const { userRecord } = res.locals;
    if (!userRecord.balance) {
        debug('no balance');
        return Promise.all([
            db.users.getBlance(userRecord.handle),
            db.users.getGasPrice(),
        ])
            .then(([balance, gas]) => {
            debug('balance', balance);
            debug('gas', gas);
            userRecord.balance = balance;
            return Promise.resolve(utils_2.rest.Response.fromSuccess(db.User.map(userRecord)));
        });
    }
    else {
        debug('balance');
        return Promise.resolve(utils_2.rest.Response.fromSuccess(db.User.map(userRecord)));
    }
}
function signup(req, res, next) {
    debug('signup', req.query);
    const { handle, phone, passwordh } = req.body;
    const PHONE_REGEX = /\d{11,13}/;
    if (!handle)
        return Promise.resolve(utils_2.rest.Response.fromBadRequest('field_required', 'handle required'));
    if (!phone || !PHONE_REGEX.test(phone))
        return Promise.resolve(utils_2.rest.Response.fromBadRequest('field_required', 'valid phone required'));
    if (!passwordh)
        return Promise.resolve(utils_2.rest.Response.fromBadRequest('field_required', 'passwordh required'));
    let phoneh;
    let passh;
    let refU;
    let linkR;
    return utils_2.cryptoLib.generateSecureCode(utils_2.cryptoLib.AUTH_CODE_CHARS, 24, true)
        .then(state => {
        return Promise.all([
            utils_2.cryptoLib.hashPhone(phone),
            utils_2.cryptoLib.hashPassword(passwordh),
        ])
            .then(([phoneHash, passHash]) => {
            debug('phoneHash', phoneHash);
            debug('passHash', passHash);
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
                return Promise.reject(utils_2.rest.Response.fromBadRequest('handle_taken', `Handle \`${handle}\` already registered`));
            }
            if (accountExists) {
                return Promise.reject(utils_2.rest.Response.fromBadRequest('user_registered', 'User already registered'));
            }
            const userId = db.User.mapId(db.newObjectId());
            debug('userId', userId);
            return Promise.all([
                utils_2.authentication.getLinkR(handle, passwordh),
                utils_2.authentication.getRefU(userId, handle, passwordh),
                utils_2.authentication.getLinkPK(userId, handle, passwordh)
            ])
                .then(([_linkR, _refA, linkPK]) => {
                refU = _refA;
                linkR = _linkR;
                debug('linkPk', linkPK);
                debug('linkR', linkR);
                debug('refA', refU);
                return db.users.create(userId, handle, refU, linkPK, state);
            })
                .then(userRecord => {
                const { address: walletAddress } = userRecord;
                return utils_2.authentication.getRefI(refU, walletAddress, passh)
                    .then(refI => {
                    const linkI = utils_2.authentication.getLinkI(linkR, refI);
                    const modifications = Object.assign({}, userRecord, { linkI });
                    return Promise.all([
                        db.users.updateById(userId, modifications),
                        db.accountInfo.create(phoneh, refI, state),
                        data_utils_1.redisConnect.instance(),
                        utils_2.cryptoLib.generateShortCode(6, utils_2.cryptoLib.Encoding.hex),
                        utils_2.cryptoLib.generateShortCode(6, utils_2.cryptoLib.Encoding.hex),
                        utils_2.cryptoLib.generateShortCode(6, utils_2.cryptoLib.Encoding.hex)
                    ]);
                })
                    .then(([_userRecord, accountInfoRecord, redisClient, roll1, roll2, code]) => {
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
                    return utils_2.cryptoLib.hashKid(accountInfoId, roll3)
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
                        return new Promise((resolve, reject) => {
                            async.parallel([
                                (cb) => redisClient.get(accountInfoKey, (error, reply) => {
                                    if (error) {
                                        cb(error);
                                    }
                                    else {
                                        cb(null, reply);
                                    }
                                }),
                                (cb) => redisClient.get(accountKey, (error, reply) => {
                                    if (error) {
                                        cb(error);
                                    }
                                    else {
                                        cb(null, reply);
                                    }
                                }),
                            ], (error, [accountInfoReply, accountReply]) => {
                                if (error || accountInfoReply !== null || accountReply !== null) {
                                    debug('error', error);
                                    debug('get: accountInfoReply', accountInfoReply);
                                    debug('get: accountReply', accountReply);
                                    return reject(utils_2.rest.Response.fromUnknownError());
                                }
                                const signupTimeout = 3 * 60;
                                async.parallel([
                                    (cb) => redisClient.setex(accountInfoKey, signupTimeout, accountInfoData, (error, reply) => {
                                        if (error) {
                                            cb(error);
                                        }
                                        else {
                                            cb(null, reply);
                                        }
                                    }),
                                    (cb) => redisClient.setex(accountKey, signupTimeout, accountData, (error, reply) => {
                                        if (error) {
                                            cb(error);
                                        }
                                        else {
                                            cb(null, reply);
                                        }
                                    })
                                ], (error, [accountInfoReply, accountReply]) => {
                                    if (error || accountInfoReply !== 'OK' || accountReply !== 'OK') {
                                        debug('error', error);
                                        debug('get: accountInfoReply', accountInfoReply);
                                        debug('get: accountReply', accountReply);
                                        return reject(utils_2.rest.Response.fromUnknownError());
                                    }
                                    utils_1.sns.sendCode(phone, code)
                                        .then(response => {
                                        const responseBody = {
                                            roll: roll1,
                                            state,
                                        };
                                        resolve(utils_2.rest.Response.fromSuccess(responseBody));
                                    })
                                        .catch(reject);
                                });
                            });
                        });
                    });
                });
            });
        })
            .catch((errorOrResponse) => {
            debug('errorOrResponse', errorOrResponse);
            if (errorOrResponse.constructor === Error) {
                return Promise.all([
                    db.users.deleteByState(state),
                    db.accountInfo.deleteByState(state),
                    db.tokens.deleteByState(state),
                ])
                    .then(() => Promise.resolve(utils_2.rest.Response.fromUnknownError()))
                    .catch(() => Promise.resolve(utils_2.rest.Response.fromUnknownError()));
            }
            else {
                if (errorOrResponse.status === STATUS.INTERNAL_SERVER_ERROR) {
                    return Promise.all([
                        db.users.deleteByState(state),
                        db.accountInfo.deleteByState(state),
                        db.tokens.deleteByState(state),
                    ])
                        .then(() => Promise.resolve(utils_2.rest.Response.fromUnknownError()))
                        .catch(() => Promise.resolve(utils_2.rest.Response.fromUnknownError()));
                }
                else {
                    return Promise.resolve(errorOrResponse);
                }
            }
        });
    });
}
function signupValidate(req, res, next) {
    const { key, roll: roll1, state, code } = req.body;
    const accountInfoKey = `signup:accountInfo:${state}.${code}`;
    return new Promise((resolve, reject) => {
        Promise.all([
            utils_2.cryptoLib.hashDeviceSecret(key),
            data_utils_1.redisConnect.instance()
        ])
            .then(([hashedKey, redisClient]) => {
            debug(hashedKey, 'hashedKey');
            debug(accountInfoKey, 'accountInfoKey');
            redisClient.get(accountInfoKey, (error, reply) => {
                if (error) {
                    return resolve(utils_2.rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                }
                if (!reply) {
                    return resolve(utils_2.rest.Response.fromBadRequest('invalid_session', 'could not identify signup session'));
                }
                let accountInfo;
                try {
                    accountInfo = JSON.parse(reply);
                }
                catch (e) {
                    debug(e);
                    return resolve(utils_2.rest.Response.fromUnknownError('internal_error', 'unable to service request'));
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
                return utils_2.cryptoLib.hashKid(accountInfo.accountInfoId, roll3)
                    .then(kid => {
                    const accountKey = `signup:account:${kid}`;
                    redisClient.get(accountKey, (error, reply) => {
                        if (error) {
                            debug(error);
                            return resolve(utils_2.rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                        }
                        if (!reply) {
                            return resolve(utils_2.rest.Response.fromBadRequest('invalid_session', 'could not identify signup session'));
                        }
                        let accountInfo;
                        try {
                            accountInfo = JSON.parse(reply);
                        }
                        catch (e) {
                            debug(e);
                            return resolve(utils_2.rest.Response.fromUnknownError('internal_error', 'unable to service request'));
                        }
                        const { userId, handle, passwordh } = accountInfo;
                        Promise.all([
                            utils_2.authentication.getRefT(handle, passwordh, hashedKey),
                            utils_2.authentication.getLinkQ(handle, passwordh, hashedKey),
                            utils_2.authentication.getRefU(userId, handle, passwordh)
                        ])
                            .then(([refT, linkQ, refU]) => {
                            const linkA = utils_2.authentication.getLinkA(linkQ, refU);
                            db.tokens.whitelist(refT, linkA, handle)
                                .then(authToken => {
                                db.users.fundUserAccount(handle)
                                    .then(() => resolve(utils_2.rest.Response.fromSuccess({ token: authToken.token })))
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
function checkHandleAvailability(req, res, next) {
    const { handle } = req.body;
    return db.users.existsByHandle(handle)
        .then(exists => {
        if (exists) {
            return utils_2.rest.Response.fromSuccess();
        }
        else {
            return utils_2.rest.Response.fromNotFound();
        }
    });
}
function uploadProfilePicture(req, res, next) {
    const { file, user } = req;
    const { handle } = user;
    return utils_1.s3.uploadFile(file)
        .then(fileUrl => db.users.updateProfilePicture(handle, fileUrl)
        .then(() => utils_2.rest.Response.fromSuccess({ url: fileUrl })));
}