"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const file = '../../python/SentimentFeatures.py';
function passToAI(id, message) {
    const subprocess = child_process_1.spawn('python', [
        file,
        id,
        message
    ], {
        cwd: '.',
        stdio: 'inherit',
        shell: true
    });
}
exports.passToAI = passToAI;