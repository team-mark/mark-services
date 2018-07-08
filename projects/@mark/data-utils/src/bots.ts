import * as backbone from './backbone';
import * as db from '@mark/db';

export interface BotMessageMetadata {
    class: 0 | 1;
    percentage0: number;
    percentage1: number;
}

export function submitMessage(message: string): Promise<BotMessageMetadata> {
    const id = db.newObjectId();
    const channel = `bots-${id}`;
    const responseChannel = `botsreply-${id}`;

    return new Promise((resolve, reject) => {

        backbone.subscribe(responseChannel)
            .then(sub => {
                sub.on('subscribe', (responseChannel: string, _message: string) => {
                    backbone.announce(channel, message);
                });

                sub.on('message', (responseChannel: string, message: string) => {
                    try {
                        const response: BotMessageMetadata = JSON.parse(message);
                        console.log(response);
                        resolve(response);
                    } catch (e) {
                        reject(e);
                    }
                    sub.unsubscribe(channel);
                });
            });
    });
}