import * as db from '@mark/db';
import { rest } from '@mark/utils';
import * as express from 'express';
const debugV = require('debug')('mark-sys:auth');

export function authBasic(req: express.Request & { user?: db.IUserDb }, res: express.Response, next: express.NextFunction): void {

    const token = req.header('Authorization');

    debugV('auth-basic:', token);

    if (!token) {
        return rest.Response.fromUnauthorized().send(res);
    }

    db.tokens.getByToken(token)
        .then(tokenRecord => {
            if (!tokenRecord) {
                return rest.Response.fromUnauthorized().send(res);
            } else {
                const { owner } = tokenRecord;

                db.users.getByHandle(owner)
                    .then(userRecord => {
                        res.locals = {
                            ...res.locals,
                            userRecord,
                            tokenRecord
                        };
                        next();
                    });
            }
        });
}
export function authAnon(req: express.Request, res: express.Response, next: express.NextFunction): void {
    debugV('auth-anon:');
    next();
}

export function notAllowed(req: express.Request, res: express.Response, next: express.NextFunction): void {
    rest.Response.fromNotAllowed().send(res);
}

export interface BasicAuthFields {
    tokenRecord: db.ITokenDb;
    userRecord: db.IUserDb;
}