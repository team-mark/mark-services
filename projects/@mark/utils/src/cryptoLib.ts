import * as crypto from 'crypto';
import * as lock from './lock';
const xor = require('buffer-xor');
const UrlSafeBase64Encode = require('urlsafe-base64');
const blake2 = require('blake2');
const debug = require('debug')('mark:cryptoLib');

/**
 *
 *
 * All inputs return a base64 encoded output unless explicitely specified in
 * the name or the call.
 * e.g. `XORHexStrings` or `generateShortCode(6, Encoding.hex)`
 *
 *
 */

export enum CharSets {
    ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alpha = 'abcdefghijklmnopqrstuvwxyz',
    numeric = '0123456789',
    urlSafeSpecial = '/+',
    nonUrlSafeSpecial = '',
}

export enum Encoding {
    base64 = 'base64',
    hex = 'hex',
    latin1 = 'latin1',
    ascii = 'ascii',
}

export function charsetGenerator(...args: any[]): string {
    return [...args].join('');
    // return args.reduce((acc: string, current: string) => `${acc}${current}`, '');
}

export const SHORT_CODE_CHARS = charsetGenerator(CharSets.ALPHA, CharSets.alpha, CharSets.numeric);
export const AUTH_CODE_CHARS = charsetGenerator(CharSets.ALPHA, CharSets.alpha, CharSets.numeric, CharSets.urlSafeSpecial);

export function getShortCode(length: number): string {
    charsetGenerator();
    return null;
}
export function createAuthToken(length: number) { }

export function generateSecureCode(charSet: string, length: number, isUrlSafe?: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        const code = new Buffer(length);
        crypto.randomFill(code, (error: Error, buffer: Buffer) => {
            const result = [];
            const length = 0;
            let cursor = 0;
            if (isUrlSafe) {
                resolve(UrlSafeBase64Encode.encode(buffer));
            } else {
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

// export function generateSecureCode(charSet: string, length: number, isUrlSafe?: boolean) {
// export function generateSecureCode(length: number) {
//     return new Promise((resolve, reject) => {
//         crypto.randomFill(new Buffer(length), (error: Error, buffer: Buffer) => {
//             if (error) {
//                 return reject(error);
//             }

//             const h = blake2.createHash('blake2b');
//             h.update(buffer);
//             const digest: string = h.digest(Encoding.base64);

//             return resolve(digest);
//         });
//     });
// }

export function generateShortCode(length: number, encoding?: Encoding): Promise<string> {
    const enc = encoding || Encoding.hex;
    return new Promise((resolve, reject) => {
        crypto.randomFill(new Buffer(length / 2), (error: Error, buffer: Buffer) => {
            if (error) {
                return reject(error);
            }

            return resolve(buffer.toString(enc));
        });
    });
}

export function hashPhone(phone: number | string): Promise<string> {
    return hashGeneric(phone.toString(), 111, Encoding.base64);
}

export function hashKid(accountId: any, iterations: number): Promise<string> {
    return hashGeneric(accountId.toString(), iterations, Encoding.base64);
}

export function hashPassword(password: string, iterations?: number): Promise<string> {
    return hashGeneric(password, iterations || 111, Encoding.base64);
}

/**
 *
 * @param toHash
 * @param iterations
 * @param toLength
 */
export function hash(toHash: string, iterations?: number, salt?: string): Promise<string> {
    return hashGeneric(toHash, iterations, Encoding.base64, salt);
}
export function hashHex(toHash: string, iterations?: number, key?: string): Promise<string> {
    return hashGeneric(toHash, iterations, Encoding.hex, key);
}
// export function hashB64(toHash: string, iterations?: number, key?: string): Promise<string> {
//     return hashGeneric(toHash, iterations, Encoding, key);
// }

/**
 *
 * @param tohash string to be hashed
 * @param iterations number of iterations
 * @param output output string ecoding
 */
function hashGeneric(tohash: string, iterations: number, output: Encoding, salt?: string): Promise<string> {
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

    // return new Promise((resolve, reject) => {
    //     crypto.pbkdf2(toHash, salt, iterations, keylen, 'blake2b', (error: Error, derivedKey: Buffer) => {
    //         if (error) {
    //             reject(error);
    //         } else {
    //             resolve(derivedKey.toString(enc));
    //         }
    //     });
    // });

    /**
     * Chains a function sequentially `iterations` number of times. Output from
     * the previous transition is fed into the next transition.
     * e.g. if the function `add1` is used with 3 iterations and primed with 1,
     * then the output to the returned function would be 4.
     * @param funct function to be chained
     * @param iterations number of chian links
     */
    function chain<T = any, T2 = (...args: T[]) => Promise<T>>(funct: T2, iterations: number, alwaysApply: any[]) {
        return (start: T) => {
            let index = 0;
            let builder: Promise<T> = Promise.resolve(start) as any;

            while (index++ < iterations) {
                builder = builder.then(out => (funct as any)(out, ...alwaysApply) as any);
            }

            return builder;
        };
    }

    /**
     *
     * @param item
     * @param encoding
     */
    function hashWithBlake2b(item: string, encoding: string): Promise<string> {
        const h = blake2.createHash('blake2b');
        h.update(Buffer.from(item));
        const digest = h.digest(encoding);
        return Promise.resolve(digest);
    }

    function hashWithBlake2bKeyed(item: string, salt: string, encoding: string): Promise<string> {
        const h = blake2.createKeyedHash('blake2b', Buffer.from(salt));
        h.update(Buffer.from(item));
        const digest = h.digest(encoding);
        return Promise.resolve(digest);
    }
}

export function XORStrings(a: string, aEncoding: string, b: string, bEncoding: string, outEncoding: string) {
    const bufHexA = Buffer.from(a, aEncoding);
    const bufHexB = Buffer.from(b, bEncoding);
    const bufHexC = xor(bufHexA, bufHexB);
    const c = bufHexC.toString(outEncoding);
    return c;
}

// export function XORAsciiStringsToHex(a: string, b: string) {
//     return XORStrings(a, Encoding.ascii, b, Encoding.ascii, Encoding.hex);
// }

export function XORAsciiStringsToBase64(a: string, b: string): string {
    return XORStrings(a, Encoding.ascii, b, Encoding.ascii, Encoding.base64);
}

export function XORHexStrings(a: string, b: string): string {
    return XORStrings(a, Encoding.hex, b, Encoding.hex, Encoding.hex);
}

export function XORBase64Strings(a: string, b: string): string {
    return XORStrings(a, Encoding.base64, b, Encoding.base64, Encoding.base64);
}

/**
 * Removes the prefix from the privateKey and XORs linkPK for refPK
 * @param linkOrRefPK e.g. 65587bb02cB4FF5DD109131F36123bb6ba6d6d32 // 40 chars
 * @param privateKey e.g. 0x8f56Abb01CB4FF518099133F3612A306ba6d6dF9 // 42 chars
 */
export function XorEthereumPrivateKey(linkOrRefPK: string, privateKey: string): string {
    const PK = privateKey.substring(2, privateKey.length);
    return XORStrings(linkOrRefPK, Encoding.base64, PK, Encoding.base64, Encoding.base64);
}