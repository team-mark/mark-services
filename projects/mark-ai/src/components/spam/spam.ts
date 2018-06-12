import { spawn } from 'child_process';
// import  * as f from ''

const file = '../../python/SentimentFeatures.py';

export function passToAI(id: string, message: string) {
    const subprocess = spawn(
        'python',
        [
            file,
            id,
            message
        ], {
            cwd: '.',
            stdio: 'inherit',
            shell: true
            // stdio: ['inherit', 'inherit', 'inherit']
        }
    );
}