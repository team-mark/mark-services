import { spawn } from 'child_process';

const debug = require('debug')('mark-ai:bot');

export interface BotMessageMetadata {
    class: 0 | 1;
    percentage0: number;
    percentage1: number;
}

const {
    REDIS_PORT,
    REDIS_HOST: host,
    REDIS_SECRET
} = process.env;
const port = +REDIS_PORT;

let pythonProcess;

import * as path from 'path';

const scriptPath = path.resolve(__dirname, '../python/mark_ai_service.py');

// Starts python bot classification script
export function init() {
    debug('starting bot');
    pythonProcess = spawn('python3', [
        scriptPath,
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