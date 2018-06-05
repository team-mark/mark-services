import * as crypto from 'crypto';
import * as lock from './lock';
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
            const h = blake2.createHash('blake2b');

            h.update(buffer);
            const digest = h.digest('base64');
            return resolve(digest);
        });
    });
}

export function hashPhone(phone: number | string): Promise<string> {
    return hashGeneric(phone.toString(), 0, 'base64');
}

export function hash(phone: number): Promise<string> {
    return hashGeneric(phone.toString(), 0, 'base64');
}

export type Encoding = 'latin1' | 'base64' | 'hex';
/**
 *
 * @param toHash string to be hashed
 * @param iterations number of iterations
 * @param encoding string ecoding
 */
function hashGeneric(toHash: string, iterations?: number, encoding?: Encoding): Promise<string> {
    const walks = iterations || 0;
    const enc = encoding || 'base64';

    // const promiseChain = generatePromiseChain<(item: string, encoding: string) => Promise<string>>(hashItem, walks);
    // return promiseChain(toHash, enc);
    return hashItem(toHash, encoding);

    /**
     *
     * @param item
     * @param encoding
     */
    function hashItem(item: string, encoding: string): Promise<string> {
        const h = blake2.createHash('blake2b');
        h.update(new Buffer(item));
        const digest = h.digest('base64');
        return Promise.resolve(digest);
    }

    /**
     *
     * @param promiseFunction
     * @param iterations
     */
    // function generatePromiseChain<T = (...args: any[]) => Promise<any>>(promiseFunction: (...args: any[]) => Promise<any>, iterations: number): T {
    //     const functionChain: ((...args: any[]) => Promise<any>)[]  = [];
    //     const parent: (...args: any[]) => Promise<any> = (...args: any[]) => {
    //         return new Promise((resolve, reject) => {
    //             let i = 0;

    //             const par = promiseFunction;

    //             while (i++ < iterations) {
    //                 // functionChain.push(promiseFunction);
    //                 par.
    //             }

    //             functionChain.reduce((acc, ))

    //         });
    //     };

    //     return parent as any as T;

    //     // // return (...args: any[]) => new Promise((resolve, reject) => {

    //     // //     let i = 0;

    //     // //     while(i < iterations) {
    //     // //         promiseFunction(...args)
    //     // //             .then(callback)
    //     // //     }
    //     // // //    return null; // promise(...args);
    //     // // });
    //     // // return (...args: any[]) => null;
    //     // const parent: (...args: any[]) => Promise<any> = (...args: any[]) => {
    //     //     return new Promise((resolve, reject) => {
    //     //         let i = 0;

    //     //         while (i++ < iterations) {
    //     //             promiseFunction(...args);
    //     //         }
    //     //     });
    //     // };

    //     // const m = new lock.Mutex({ isLocked: true });

    //     // return parent as any as T;
    //     // // return null;

    // }
}
