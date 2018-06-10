import * as crypto from 'crypto';
import * as lock from './lock';
const xor = require('buffer-xor');
const UrlSafeBase64Encode = require('urlsafe-base64');
const blake2 = require('blake2');

export enum CharSets {
    ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alpha = 'abcdefghijklmnopqrstuvwxyz',
    numeric = '0123456789',
    urlSafeSpecial = '/+',
    nonUrlSafeSpecial = '',
}

export function charsetGenerator(...args: any[]): String {
    return args.reduce((acc: string, current: string) => `${acc}${current}`, '');
}

export const SHORT_CODE_CHARS = charsetGenerator(CharSets.ALPHA, CharSets.alpha, CharSets.numeric);
export const AUTH_CODE_CHARS = charsetGenerator(CharSets.ALPHA, CharSets.alpha, CharSets.numeric, CharSets.urlSafeSpecial);

export function getShortCode(length: number): string {
    charsetGenerator();
    return null;
}
export function createAuthToken(length: number) { }

// export function generateSecureCode(charSet: string, length: number, isUrlSafe?: boolean) {
//     return new Promise((resolve, reject) => {
//         const code = new Buffer(length);
//         crypto.randomFill(code, (error: Error, buffer: Buffer) => {
//             const result = [];
//             const length = 0;
//             const charsLength = charSet.length;
//             let cursor = 0;
//             if (isUrlSafe) {
//                 resolve(UrlSafeBase64Encode.encode(buffer));
//             } else {
//                 for (let i = 0; i < length; i++) {
//                     cursor += buffer[i];
//                     result
//                 }
//             }
//         });
//     });
// }

// export function generateSecureCode(charSet: string, length: number, isUrlSafe?: boolean) {
export function generateSecureCode(length: number) {
    return new Promise((resolve, reject) => {
        crypto.randomFill(new Buffer(length), (error: Error, buffer: Buffer) => {
            if (error) {
                return reject(error);
            }
            const h = blake2.createHash('blake2b');

            h.update(buffer);
            const digest = h.digest('base64');
            return resolve(digest);
        });
    });
}

export function generateHexCode(length: number): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomFill(new Buffer(length / 2), (error: Error, buffer: Buffer) => {
            if (error) {
                return reject(error);
            }

            return resolve(buffer.toString('hex'));
        });
    });
}

export function hashPhone(phone: number | string): Promise<string> {
    return hashGeneric(phone.toString(), 111, 'base64');
}

export function hashKid(accountId: any, iterations: number): Promise<string> {
    return hashGeneric(accountId.toString(), iterations, 'base64');
}

export function hashPassword(password: string, iterations?: number): Promise<string> {
    return hashGeneric(password, iterations || 111, 'base64');
}

/**
 *
 * @param toHash
 * @param iterations
 * @param toLength
 */
export function hash(toHash: string, iterations?: number, key?: string): Promise<string> {
    return hashGeneric(toHash, iterations, 'base64', key);
}
export function hashHex(toHash: string, iterations?: number, key?: string): Promise<string> {
    return hashGeneric(toHash, iterations, 'hex', key);
}

export type Encoding = 'latin1' | 'base64' | 'hex';
/**
 *
 * @param toHash string to be hashed
 * @param iterations number of iterations
 * @param encoding string ecoding
 */
function hashGeneric(toHash: string, iterations: number, encoding: Encoding, key?: string): Promise<string> {
    const walks = iterations || 1;
    const enc = encoding || 'base64';
    const salt = key || 'salt';
    const keylen = 64;

    // const hashFunction = key ? hashWithBlake2bKeyed : hashWithBlake2b;
    // const hashChain = chain(hashFunction, iterations);
    // const hash = hashChain(toHash, encoding);

    return new Promise((resolve, reject) => {
        crypto.pbkdf2(toHash, salt, iterations, keylen, 'blake2b', (error: Error, derivedKey: Buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(derivedKey.toString(enc));
            }
        });
    });

    // return hash;
    // /**
    //  * Chains a function sequentially `iterations` number of times. Output from
    //  * the previous transition is fed into the next transition.
    //  * e.g. if the function `add1` is used with 3 iterations and primed with 1,
    //  * then the output to the returned function would be 4.
    //  * @param funct function to be chained
    //  * @param iterations number of chian links
    //  */
    // function chain<T = any, T2 = (...args: T[]) => Promise<T>>(funct: T2, iterations: number) {
    //     return (...args: T[]) => {
    //         let index = 0;
    //         let builder: Promise<T> = Promise.resolve(...args) as any;

    //         while (index++ < iterations) {
    //             builder = builder.then(funct as any);
    //         }

    //         return builder;
    //     };
    // }

    // /**
    //  *
    //  * @param item
    //  * @param encoding
    //  */
    // function hashWithBlake2b(item: string, encoding: string): Promise<string> {
    //     const h = blake2.createHash('blake2b');
    //     h.update(new Buffer(item));
    //     const digest = h.digest('base64');
    //     return Promise.resolve(digest);
    // }

    // function hashWithBlake2bKeyed(item: string, key: string, encoding: string): Promise<string> {
    //     const h = blake2.createKeyedhash('blake2b', new Buffer(key));
    //     h.update(new Buffer(item));
    //     const digest = h.digest('base64');
    //     return Promise.resolve(digest);
    // }
}

// export function XORAsciiStrings(a: string, b: string) {
//     const hexA = new Buffer(a, 'ascii');
//     const hexB = new Buffer(b, 'ascii');
//     const bufHexC = xor(hexA, hexB);
//     // const intA = parseInt(hexA, 16);
//     // const intB = parseInt(hexB, 16);
//     // const intC = intA ^ intB;
//     // const hexC = intC.toString(16);
//     // const c = new Buffer(hexC, 'hex').toString();
//     // return c;
// }

export function XORAsciiStringsToHex(a: string, b: string) {
    const bufHexA = new Buffer(a, 'ascii');
    const bufHexB = new Buffer(b, 'ascii');
    const bufHexC = xor(bufHexA, bufHexB);
    const c = bufHexC.toString('hex');
    return c;
}
export function XORHexStrings(a: string, b: string) {
    const bufHexA = new Buffer(a, 'hex');
    const bufHexB = new Buffer(b, 'hex');
    const bufHexC = xor(bufHexA, bufHexB);
    const c = bufHexC.toString('hex');
    return c;
}
