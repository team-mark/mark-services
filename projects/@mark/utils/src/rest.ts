import * as express from 'express';
import * as STATUS from 'http-status';

export interface ResponseReason {
    details: string;
    query: string;
}

export class RestResponse {
    public constructor(private status: number, private body?: any) {
        return this;
    }

    public send(res: express.Response) {
        res.status(this.status);
        res.send(this.body);
    }

    public static fromSuccess(body?: any): RestResponse {
        const restResponse = new RestResponse(STATUS.OK, body);
        return restResponse;
    }

    public static fromNotFound(query_parameters?: any): RestResponse {
        const reason = 'could not locate record(s)';
        const body = { details: reason } as any;
        if (query_parameters) {
            body.query = query_parameters.toString();
        }
        const restResponse = new RestResponse(STATUS.NOT_FOUND, body);
        return restResponse;
    }

    public static fromNotAllowed(): RestResponse {
        const reason = 'not allowed';
        const body = { details: reason };
        const restResponse = new RestResponse(STATUS.NOT_FOUND, body);
        return restResponse;
    }

    public static fromUnauthorized(): RestResponse {
        const reason = 'unauthorized';
        const body = { details: reason };
        const restResponse = new RestResponse(STATUS.UNAUTHORIZED, body);
        return restResponse;
    }

    public static fromDbError(): RestResponse {
        const reason = 'database error';
        const body = { details: reason };
        const restResponse = new RestResponse(STATUS.INTERNAL_SERVER_ERROR, body);
        return restResponse;
    }
}

export function promiseResponseMiddlewareWrapper(debug: any) {
    // debug('generating middleware');
    return (promiseMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<RestResponse>): express.RequestHandler => {
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
    const restResponse = RestResponse.fromNotFound();
    restResponse.send(res);
}
