#!/ usr / bin / env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
const init_1 = require("./init");
const http = require("http");
const debug = require('debug')('mark:server');
const port = normalizePort(process.env.PORT || '4000');
let server;
process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
process.on('SIGBREAK', sigbreakHandler);
init_1.init()
    .then(() => {
    const app = require('./app');
    app.set('port', port);
    server = http.createServer(app);
    server.on('error', onError);
    server.on('listening', onListening);
    server.listen(port);
})
    .catch(onError);
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
}
function onError(error) {
    debug(error);
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
function sigbreakHandler() {
    debug('SIGBREAK - exiting');
    process.exit(1);
}
function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}