import * as db from '@mark/db';
import { rest } from '@mark/utils';
import * as express from 'express';

export function authBasic(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const token = req.header('Authorization');
    if (!token) {
        return rest.RestResponse.fromUnauthorized().send(res);
    }

    db.tokens.getById(token)
        .then(tokenRecord => {
            if (!token) {
                return rest.RestResponse.fromUnauthorized().send(res);
            } else {
                next();
            }
        });
}
export function authAnon(req: express.Request, res: express.Response, next: express.NextFunction): void {
    next();
}

export function notAllowed(req: express.Request, res: express.Response, next: express.NextFunction): void {
    rest.RestResponse.fromNotAllowed().send(res);
}