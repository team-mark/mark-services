"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cryptoLib = require("./cryptoLib");
exports.DEFAULT_HASH_RATE = 55 * 55;
function getPAD(handle, passwordh) {
    const h1 = handle.charAt(0);
    const p1 = passwordh.charAt(0);
    const p = h1.charCodeAt(0);
    const ad = p1.charCodeAt(0);
    return `${p}.${ad}`;
}
exports.getPAD = getPAD;
function getPADParts(PAD) {
    const [p, ad] = PAD.split('.');
    return {
        p: parseInt(p, 10),
        ad: parseInt(ad, 10)
    };
}
exports.getPADParts = getPADParts;
function getRefT(handle, passwordh, OTP) {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127;
    const r = 127 - ad;
    const iterations = p * r;
    const tohash = `${handle}:${passwordh}:${OTP}`;
    return cryptoLib.hash(tohash, iterations)
        .then(refT => Promise.resolve(refT));
}
exports.getRefT = getRefT;
function getRefU(userId, handle, passwordh) {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127;
    const r = 127 - ad;
    const iterations = p * r;
    const tohash = `${userId}:${handle}:${passwordh}`;
    return cryptoLib.hash(tohash, iterations)
        .then(refU => Promise.resolve(refU));
}
exports.getRefU = getRefU;
function getRefI(refU, walletAddress, passwordh) {
    const iterations = exports.DEFAULT_HASH_RATE;
    const tohash = `${refU}:${walletAddress}:${passwordh}`;
    return cryptoLib.hash(tohash, iterations)
        .then(refI => Promise.resolve(refI));
}
exports.getRefI = getRefI;
function getLinkQ(handle, passwordh, OTP) {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127;
    const r = 127 - ad;
    const iterations = p * r;
    const tohash = `${p}:${OTP}:${ad}`;
    return cryptoLib.hash(tohash, iterations)
        .then(linkQ => Promise.resolve(linkQ));
}
exports.getLinkQ = getLinkQ;
function getLinkR(handle, passwordh) {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127;
    const r = 127 - ad;
    const iterations = p * r;
    const tohash = `${p}:${handle}:${passwordh}:${ad}`;
    return cryptoLib.hash(tohash, iterations)
        .then(linkR => Promise.resolve(linkR));
}
exports.getLinkR = getLinkR;
function getLinkI(linkR, refI) {
    const linkI = cryptoLib.XORBase64Strings(linkR, refI);
    return linkI;
}
exports.getLinkI = getLinkI;
function getLinkA(linkQ, refU) {
    const linkA = cryptoLib.XORBase64Strings(linkQ, refU);
    return linkA;
}
exports.getLinkA = getLinkA;
function getRefPK(linkPK, privateKey) {
    const pkSub = privateKey.substr(2);
    const refPK = cryptoLib.XORBase64Strings(linkPK, pkSub);
    return refPK;
}
exports.getRefPK = getRefPK;
function getPrivateKey(linkPK, refPk) {
    const raw = cryptoLib.XORBase64Strings(linkPK, refPk);
    console.log('raw password', raw);
    const privateKey = `0x${raw.replace(/=/g, '')}`;
    console.log('pk', privateKey);
    return privateKey;
}
exports.getPrivateKey = getPrivateKey;
function getLinkPK(userId, handle, passwordh) {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127;
    const r = 127 - ad;
    const iterations = p * r;
    const tohash = `${p}:${ad}:${handle}:${passwordh}:${userId}:${p}:${ad}`;
    return cryptoLib.hash(tohash, iterations)
        .then(hash => {
        const linkPK = hash.substr(1, 64);
        return Promise.resolve(linkPK);
    });
}
exports.getLinkPK = getLinkPK;
function getPKfromRefPK(linkPK, refPK) {
    const PK = cryptoLib.XORBase64Strings(linkPK, refPK);
    return `0x${PK}`;
}
exports.getPKfromRefPK = getPKfromRefPK;