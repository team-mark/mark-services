import * as backbone from './backbone';
import * as db from '@mark/db';
import { IMarkConsumer } from '../../db';
import { marks } from '../../db';

// Time to wait until classifing Mark in Hours
const TIME_TO_CHECK = 1;

export interface BotMessageMetadata {
    class: 0 | 1;
    percentage0: number;
    percentage1: number;
}

function getMarksForBotCheck(user: string): Promise<IMarkConsumer []> {
    const date = new Date();

    date.setHours(date.getHours() - TIME_TO_CHECK);
    const query = { createdAt: {$lt: date}, bot: 'UNKNOWN', owner: user};

    return marks.getMarks(1, 0, 50, query);
}

function classifyMark(mark: IMarkConsumer) {
    const response = submitMessage(mark.body);
    response.then(botClass => {
        const query = {_id: mark.id};
        let update = {};

        if (botClass.class === 1)
            update = { bot: 'BOT' };
        else if (botClass.class === 0)
            update = { bot: 'USER' };
        marks.update(query, update);
    });
}

export function botCheck(user: string) {
    getMarksForBotCheck(user)
        .then(marks => {
            marks.forEach(element => {
                classifyMark(element);
            });
        });
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