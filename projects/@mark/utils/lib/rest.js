"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const STATUS = require("http-status");
const debug = require('debug')('mark:rest');
var ResponseType;
(function (ResponseType) {
    ResponseType["Success"] = "Success";
    ResponseType["NotFound"] = "NotFound";
    ResponseType["NotAllowed"] = "NotAllowed";
    ResponseType["BadRequest"] = "BadRequest";
    ResponseType["Unauthorized"] = "Unauthorized";
    ResponseType["ServerError"] = "ServerError";
})(ResponseType || (ResponseType = {}));
class Response {
    constructor(status, body) {
        this.status = status;
        this.body = body;
        return this;
    }
    send(res) {
        res.status(this.status);
        res.send(this.body);
    }
    static fromSuccess(body) {
        const restResponse = new Response(STATUS.OK, body);
        return restResponse;
    }
    static fromNotFound(query_parameters) {
        const reason = 'could not locate record(s)';
        const body = { details: reason };
        if (query_parameters) {
            body.query = query_parameters.toString();
        }
        const restResponse = new Response(STATUS.NOT_FOUND, body);
        return restResponse;
    }
    static fromNotAllowed() {
        const reason = 'not allowed';
        const body = { details: reason };
        const restResponse = new Response(STATUS.NOT_FOUND, body);
        return restResponse;
    }
    static fromBadRequest(code, reason) {
        const body = { code, details: reason };
        const restResponse = new Response(STATUS.BAD_REQUEST, body);
        return restResponse;
    }
    static fromUnauthorized() {
        const reason = 'unauthorized';
        const body = { details: reason };
        const restResponse = new Response(STATUS.UNAUTHORIZED, body);
        return restResponse;
    }
    static fromUnknownError(code, reason) {
        code = code || 'server_error';
        reason = reason || 'internal server error';
        const body = { code, details: reason };
        const restResponse = new Response(STATUS.INTERNAL_SERVER_ERROR, body);
        return restResponse;
    }
}
exports.Response = Response;
function promiseResponseMiddlewareWrapper(debug) {
    return (promiseMiddleware) => {
        return (req, res, next) => {
            promiseMiddleware(req, res, next)
                .then(restResponse => {
                debug('responding to middleware', restResponse);
                restResponse.send(res);
            })
                .catch(error => {
                debug('error in middleware');
                if (error) {
                    debug(error);
                }
                res.status(STATUS.INTERNAL_SERVER_ERROR);
                res.send();
            });
        };
    };
}
exports.promiseResponseMiddlewareWrapper = promiseResponseMiddlewareWrapper;
function verify(req, res, next) {
    req.query = Object.assign({}, req.query);
    req.params = Object.assign({}, req.params);
    req.body = Object.assign({}, req.body);
    next();
}
exports.verify = verify;
function notAllowed(req, res, next) {
    const restResponse = Response.fromNotFound();
    restResponse.send(res);
}
exports.notAllowed = notAllowed;