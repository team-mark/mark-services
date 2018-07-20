"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const authentication_1 = require("./authentication");
const xor = require('buffer-xor');
const UrlSafeBase64Encode = require('urlsafe-base64');
const blake2 = require('blake2');
const debug = require('debug')('mark:cryptoLib');
var CharSets;
(function (CharSets) {
    CharSets["ALPHA"] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    CharSets["alpha"] = "abcdefghijklmnopqrstuvwxyz";
    CharSets["numeric"] = "0123456789";
    CharSets["urlSafeSpecial"] = "/+";
    CharSets["nonUrlSafeSpecial"] = "";
})(CharSets = exports.CharSets || (exports.CharSets = {}));
var Encoding;
(function (Encoding) {
    Encoding["base64"] = "base64";
    Encoding["hex"] = "hex";
    Encoding["latin1"] = "latin1";
    Encoding["ascii"] = "ascii";
})(Encoding = exports.Encoding || (exports.Encoding = {}));
function charsetGenerator(...args) {
    return [...args].join('');
}
exports.charsetGenerator = charsetGenerator;
exports.SHORT_CODE_CHARS = charsetGenerator(CharSets.ALPHA, CharSets.alpha, CharSets.numeric);
exports.AUTH_CODE_CHARS = charsetGenerator(CharSets.ALPHA, CharSets.alpha, CharSets.numeric, CharSets.urlSafeSpecial);
function getShortCode(length) {
    charsetGenerator();
    return null;
}
exports.getShortCode = getShortCode;
function createAuthToken(length) { }
exports.createAuthToken = createAuthToken;
function generateSecureCode(charSet, length, isUrlSafe) {
    return new Promise((resolve, reject) => {
        const code = new Buffer(length);
        crypto.randomFill(code, (error, buffer) => {
            const result = [];
            const length = 0;
            let cursor = 0;
            if (isUrlSafe) {
                resolve(UrlSafeBase64Encode.encode(buffer));
            }
            else {
                for (let i = 0; i < length; i++) {
                    cursor += buffer[i];
                    result[i] = charSet[cursor % charSet.length];
                }
                const hash = result.join('');
                resolve(hash);
            }
        });
    });
}
exports.generateSecureCode = generateSecureCode;
function generateShortCode(length, encoding) {
    const enc = encoding || Encoding.hex;
    return new Promise((resolve, reject) => {
        crypto.randomFill(new Buffer(length / 2), (error, buffer) => {
            if (error) {
                return reject(error);
            }
            return resolve(buffer.toString(enc));
        });
    });
}
exports.generateShortCode = generateShortCode;
function hashPhone(phone) {
    return hashGeneric(phone.toString(), 111, Encoding.base64);
}
exports.hashPhone = hashPhone;
function hashKid(accountId, iterations) {
    return hashGeneric(accountId.toString(), iterations, Encoding.base64);
}
exports.hashKid = hashKid;
function hashPassword(password, iterations) {
    return hashGeneric(password, iterations || authentication_1.DEFAULT_HASH_RATE, Encoding.base64);
}
exports.hashPassword = hashPassword;
function hashDeviceSecret(secret) {
    return hashGeneric(secret, authentication_1.DEFAULT_HASH_RATE, Encoding.base64);
}
exports.hashDeviceSecret = hashDeviceSecret;
function hash(toHash, iterations, salt) {
    return hashGeneric(toHash, iterations, Encoding.base64, salt);
}
exports.hash = hash;
function hashHex(toHash, iterations, key) {
    return hashGeneric(toHash, iterations, Encoding.hex, key);
}
exports.hashHex = hashHex;
function hashGeneric(tohash, iterations, output, salt) {
    iterations = iterations || 1;
    const enc = output || Encoding.base64;
    const keylen = 64;
    const hashFunction = salt ? hashWithBlake2bKeyed : hashWithBlake2b;
    const hashChain = chain(hashFunction, iterations, [salt, enc]);
    debug(`[${iterations}] hashing ${tohash} with salt [${salt}]`);
    return hashChain(tohash)
        .then(hash => {
        hash = hash.toString(enc);
        return Promise.resolve(hash);
    });
    function chain(funct, iterations, alwaysApply) {
        return (start) => {
            let index = 0;
            let builder = Promise.resolve(start);
            while (index++ < iterations) {
                builder = builder.then(out => funct(out, ...alwaysApply));
            }
            return builder;
        };
    }
    function hashWithBlake2b(item, encoding) {
        const h = blake2.createHash('blake2b');
        h.update(Buffer.from(item));
        const digest = h.digest(encoding);
        return Promise.resolve(digest);
    }
    function hashWithBlake2bKeyed(item, salt, encoding) {
        const h = blake2.createKeyedHash('blake2b', Buffer.from(salt));
        h.update(Buffer.from(item));
        const digest = h.digest(encoding);
        return Promise.resolve(digest);
    }
}
function XORStrings(a, aEncoding, b, bEncoding, outEncoding) {
    const bufHexA = Buffer.from(a, aEncoding);
    const bufHexB = Buffer.from(b, bEncoding);
    const bufHexC = xor(bufHexA, bufHexB);
    const c = bufHexC.toString(outEncoding);
    return c;
}
exports.XORStrings = XORStrings;
function XORAsciiStringsToBase64(a, b) {
    return XORStrings(a, Encoding.ascii, b, Encoding.ascii, Encoding.base64);
}
exports.XORAsciiStringsToBase64 = XORAsciiStringsToBase64;
function XORHexStrings(a, b) {
    return XORStrings(a, Encoding.hex, b, Encoding.hex, Encoding.hex);
}
exports.XORHexStrings = XORHexStrings;
function XORBase64Strings(a, b) {
    return XORStrings(a, Encoding.base64, b, Encoding.base64, Encoding.base64);
}
exports.XORBase64Strings = XORBase64Strings;
function XorEthereumPrivateKey(linkOrRefPK, privateKey) {
    const PK = privateKey.substring(2, privateKey.length);
    return XORStrings(linkOrRefPK, Encoding.base64, PK, Encoding.base64, Encoding.base64);
}
exports.XorEthereumPrivateKey = XorEthereumPrivateKey;