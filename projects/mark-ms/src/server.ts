#!/ usr / bin / env node

// add sourcemap support for typescript
require('source-map-support').install();

/**
 * Module dependencies.
 */
import { init } from './init';
import * as http from 'http';

const debug = require('debug')('mark:server');

const port = normalizePort(process.env.PORT || '4000');
let server: http.Server;

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
process.on('SIGBREAK', sigbreakHandler);

init()
    .then(() => {
        const app = require('./app');

        app.set('port', port);
        server = http.createServer(app);

        server.on('error', onError);
        server.on('listening', onListening);
        server.listen(port);
    })
    .catch(onError);

/**
 * Listen on provided port, on all network interfaces.
 */

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
    debug(error);

    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
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

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('Listening on ' + bind);
}
