"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const debug = require('debug')('mark-ai:bot');
const { REDIS_PORT, REDIS_HOST: host, REDIS_SECRET } = process.env;
const port = +REDIS_PORT;
let pythonProcess;
function init() {
    debug('starting bot');
    pythonProcess = child_process_1.spawn('python', ['./projects/mark-ai/src/python/mark_ai_service.py',
        '-h', host,
        '-s', REDIS_SECRET,
        '-p', REDIS_PORT]);
    pythonProcess.stdout.on('data', data => {
        debug(`mark_ai_service: ${data}`);
    });
    pythonProcess.stderr.on('data', data => {
        debug(`Error: ${data}`);
    });
}
exports.init = init;