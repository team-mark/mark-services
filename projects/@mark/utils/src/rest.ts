import * as express from 'express';
import * as STATUS from 'http-status';

export interface ResponseReason {
    details: string;
    query: string;
}

enum ResponseType {
    Success = 'Success',
    NotFound = 'NotFound',
    NotAllowed = 'NotAllowed',
    BadRequest = 'BadRequest',
    Unauthorized = 'Unauthorized',
    ServerError = 'ServerError',
}

export class Response {
    public constructor(public status: number, private body?: any) {
        return this;
    }

    public send(res: express.Response) {
        res.status(this.status);
        res.send(this.body);
    }

    public static fromSuccess(body?: any): Response {
        const restResponse = new Response(STATUS.OK, body);
        return restResponse;
    }

    public static fromNotFound(query_parameters?: any): Response {
        const reason = 'could not locate record(s)';
        const body = { details: reason } as any;
        if (query_parameters) {
            body.query = query_parameters.toString();
        }
        const restResponse = new Response(STATUS.NOT_FOUND, body);
        return restResponse;
    }

    public static fromNotAllowed(): Response {
        const reason = 'not allowed';
        const body = { details: reason };
        const restResponse = new Response(STATUS.NOT_FOUND, body);
        return restResponse;
    }

    public static fromBadRequest(code: string, reason: string): Response {
        const body = { code, details: reason };
        const restResponse = new Response(STATUS.BAD_REQUEST, body);
        return restResponse;
    }

    public static fromUnauthorized(): Response {
        const reason = 'unauthorized';
        const body = { details: reason };
        const restResponse = new Response(STATUS.UNAUTHORIZED, body);
        return restResponse;
    }

    public static fromServerError(code?: string, reason?: string): Response {

        code = code || 'server_error';
        reason = reason || 'internal server error';
        const body = { code, details: reason };
        const restResponse = new Response(STATUS.INTERNAL_SERVER_ERROR, body);
        return restResponse;
    }
}

export function promiseResponseMiddlewareWrapper(debug: any) {
    // debug('generating middleware');
    return (promiseMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<Response>): express.RequestHandler => {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            // debug('generating middleware');
            promiseMiddleware(req, res, next)
                .then(restResponse => {
                    // debug('responding to middleware');
                    restResponse.send(res);
                })
                .catch(error => {
                    // debug('error in middleware');
                    if (debug) {
                        debug(error);
                    }
                    res.status(STATUS.INTERNAL_SERVER_ERROR);
                    res.send();
                });
        };
    };
}

export function verify(req: express.Request, res: express.Response, next: express.NextFunction): void {
    req.query = { ...req.query };
    req.params = { ...req.params };
    req.body = { ...req.body };
    next();
}

export function notAllowed(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const restResponse = Response.fromNotFound();
    restResponse.send(res);
}
