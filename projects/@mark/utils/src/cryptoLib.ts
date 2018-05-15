import * as crypto from 'crypto';
const UrlSafeBase64Encode = require('urlsafe-base64');
const blake2 = require('blake2');
const h = blake2.createHash('blake2b');

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

export function getShortCode(length: number) {
    charsetGenerator();
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

            h.update(buffer);
            const digest = h.digest('base64');
            return resolve(digest);
        });
    });
}