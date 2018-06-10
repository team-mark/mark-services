import * as  cryptoLib from './cryptoLib';

export const DEFAULT_HASH_RATE = 55 * 55;

/**
 * A string `P.AD` which represents the decimal character values of the first
 * letters of the (assumed) ascii strings, handle and hashed password, respectively.
 * e.g. if handle = johnsmith, passwordh = abc123
 * as j = 103, a = 97
 * PAD = `103.97`
 * @param handle
 * @param passwordh
 */
export function getPAD(handle: string, passwordh: string) {
    const h1 = handle.charAt(0);
    const p1 = passwordh.charAt(0);
    const p = h1.charCodeAt(0);
    const ad = p1.charCodeAt(0);
    return `${p}.${ad}`;
}

/**
 * Parses the decimal string values from a PAD and returns the decimal number
 * values in an object (see getPAD).
 * @param PAD
 */
export function getPADParts(PAD: string): { p: number, ad: number } {
    const [p, ad] = PAD.split('.');
    return {
        p: parseInt(p, 10),
        ad: parseInt(ad, 10)
    };

}

/**
 * Reference value on token (for lookup)
 * This value is easily replicated with the OPT, which allows the system to be
 * able to verify that the device using the token is allowed to be using the token.
 * @param handle
 * @param passwordh
 * @param OTP
 */
export function getRefT(handle: string, passwordh: string, OTP: string): Promise<string> {
    // p = first letter (handle)
    // q = first letter (pass)
    // r = max - q
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127; // max char value (DEL)
    const r = 127 - ad;
    const iterations = p * r;

    const toash = `${handle}:${passwordh}:${OTP}`;
    // const salt = `:${passwordh}:${OTP}`;

    return cryptoLib.hash(toash, iterations)
        .then(refT => Promise.resolve(refT));
}

/**
 * Reference info on Account. Point to by linkA, unlocked with linkQ.
 * @param accountId
 * @param phoneh
 * @param handle
 * @param passwordh
 */
export function getRefA(accountId: string, handle: string, passwordh: string): Promise<string> {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127; // max char value (DEL)
    const r = 127 - ad;
    const iterations = p * r;

    const tohash = `${accountId}:${handle}:${passwordh}`;
    // const salt = `${passwordh}:${handle}`;

    return cryptoLib.hash(tohash, iterations)
        .then(refA => Promise.resolve(refA));
}

/**
 * Reference info on Account Info. Point to by linkI, unlocked with linkR.
 * @param refI
 * @param walletAddress
 * @param passwordh
 * @return BASE64 STRING
 */
export function getRefI(refA: string, walletAddress: string, passwordh: string): Promise<string> {
    const iterations = DEFAULT_HASH_RATE;
    const tohash = `${refA}:${walletAddress}:${passwordh}`;
    // const salt = `${walletAddress}:${passwordh}`;

    return cryptoLib.hash(tohash, iterations)
        .then(refI => Promise.resolve(refI));
}

/**
 * Linking OPT key between token and account.
 * @param PAD
 * @param OTP
 * @return BASE64 STRING
 */
export function getLinkQ(PAD: string, OTP: string): Promise<string> {
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127; // max char value (DEL)
    const r = 127 - ad;
    const iterations = p * r;

    const tohash = `${p}:${OTP}:${ad}`;
    // const salt = `${ad}:${p}:${OTP}`;

    return cryptoLib.hash(tohash, iterations)
        .then(linkQ => Promise.resolve(linkQ));
}

/**
 * Linking OTP key between account and accountInfo
 * @param handle
 * @param passwordh
 * @return BASE64 STRING
 */
export function getLinkR(handle: string, passwordh: string): Promise<string> {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127; // max char value (DEL)
    const r = 127 - ad;
    const iterations = p * r;

    const tohash = `${p}:${handle}:${passwordh}:${ad}`;
    // const salt = `${handle}:${handle}:${handle}`;
    return cryptoLib.hash(tohash, iterations)
        .then(linkR => Promise.resolve(linkR));
}

/**
 * Linking reference from account to account info
 * @param linkR
 * @param refA
 * @return BASE64 STRING
 */
export function getLinkI(linkR: string, refA: string): string {
    const linkA = cryptoLib.XORBase64Strings(linkR, refA);
    return linkA;
}

/**
 *
 * Linking reference from token to account
 * @param linkQ
 * @param refW
 * @return BASE64 STRING
 */
export function getLinkA(linkQ: string, refW: string) {
    const linkA = cryptoLib.XORBase64Strings(linkQ, refW);
    return linkA;
}

/**
 * Stored on user record for private key decryption.
 * @param linkPK base64
 * @param privateKey base64
 * @return BASE64 STRING
 */
export function getRefPK(linkPK: string, privateKey: string) {
    const refPK = cryptoLib.XORBase64Strings(linkPK, privateKey);
    return refPK;
}

/**
 * Derived on the fly for encrypting wallet private key.
 * @param userId
 * @param handle
 * @param linkR
 * @param refA
 * @param linkI
 * @return BASE64 STRING of length 40
 */
export function getLinkPK(userId: string, handle: string, passwordh: string) {
    const PAD = getPAD(handle, passwordh);
    const { p, ad } = getPADParts(PAD);
    const MAX_CHAR = 127; // max char value (DEL)
    const r = 127 - ad;
    const iterations = p * r;

    const tohash = `${p}:${ad}:${handle}:${passwordh}:${userId}:${p}:${ad}`;
    // const salt = `${passwordh}:${ad}:${handle}:${p}`;

    return cryptoLib.hash(tohash, iterations)
        .then(hash => {
            const linkPK = hash.substr(1, 40);
            return Promise.resolve(linkPK);
        });
}

/**
 * Get private key back from refPK in ethereum format.
 * @param linkPK
 * @param refPK
 */
export function getPKfromRefPK(linkPK: string, refPK: string) {
    const PK = cryptoLib.XORBase64Strings(linkPK, refPK);
    return `0x${PK}`;
}