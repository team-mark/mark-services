import * as db from '@mark/db';
import { rest } from '@mark/utils';
import * as express from 'express';

export function authBasic(req: express.Request & { user?: db.IUserDb }, res: express.Response, next: express.NextFunction): void {
    const token = req.header('Authorization');
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
                        req.user = userRecord;
                        next();
                    });
            }
        });
}
export function authAnon(req: express.Request, res: express.Response, next: express.NextFunction): void {
    next();
}

export function notAllowed(req: express.Request, res: express.Response, next: express.NextFunction): void {
    rest.Response.fromNotAllowed().send(res);
}