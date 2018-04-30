import * as express from 'express';
import * as STATUS from 'http-status';

export interface ResponseReason {
    details: string;
    query: string;
}

export class RestResponse {
    public constructor(private res: express.Response, private status: number, private body?: any) {
        return this;
    }

    public send() {
        this.res.status(this.status);
        this.res.send(this.body);
    }

    public static fromSuccess(res: express.Response, body?: any): RestResponse {
        const restResponse = new RestResponse(res, STATUS.OK, body);
        return restResponse;
    }

    public static fromNotFound(res: express.Response, query_parameters?: any): RestResponse {
        const reason = 'could not locate record(s)';
        const body = { details: reason, query: query_parameters.toString() };
        const restResponse = new RestResponse(res, STATUS.NOT_FOUND, body);
        return restResponse;
    }

    public static fromNotAllowed(res: express.Response): RestResponse {
        const reason = 'not allowed';
        const body = { details: reason };
        const restResponse = new RestResponse(res, STATUS.NOT_FOUND, body);
        return restResponse;
    }
}

export function promiseResponseMiddlewareWrapper(debug: any) {
    return (promiseMiddleware: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<RestResponse>) => {
        (req: express.Request, res: express.Response, next: express.NextFunction) => {
            promiseMiddleware(req, res, next)
                .then(restResponse => {
                    restResponse.send();
                })
                .catch(error => {
                    if (debug) {
                        debug(error);
                    }
                    res.status(STATUS.INTERNAL_SERVER_ERROR);
                    res.send();
                });
        };
    };
}

export function notAllowed(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const restResponse = RestResponse.fromNotFound(res);
    restResponse.send();
}
