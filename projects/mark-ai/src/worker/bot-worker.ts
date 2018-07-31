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

// Starts python bot classification script
export function init() {
    debug('starting bot');
    pythonProcess = spawn('python3', ['./projects/mark-ai/src/python/mark_ai_service.py',
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