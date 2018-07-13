import * as backbone from './backbone';
import * as db from '@mark/db';

const debug = require('debug')('mark:bots');

// Time to wait until classifing Mark in Hours
const TIME_TO_CHECK = 1;

export interface BotMessageMetadata {
    class: 0 | 1;
    percentage0: number;
    percentage1: number;
}

// retrieves Marks that need to be classified by user
function getMarksForBotCheck(user: string): Promise<db.IMarkConsumer []> {
    const date = new Date();

    date.setHours(date.getHours() - TIME_TO_CHECK);
    const query = { createdAt: {$lt: date}, bot: 'UNKNOWN', owner: user};

    return db.marks.getMarks(1, 0, 50, query);
}

// updates Mark bot flag on mongo
function classifyMark(mark: db.IMarkConsumer) {
    debug(`Classifying ${mark.body}`);
    const response = submitMessage(mark.body);

    response.then(botClass => {
        const query = {_id: new db.ObjectID(mark.id)};
        let update = {};

        debug(`Classifier response: ${botClass.class}`);

        if (botClass.class === 1)
            update = { $set: { bot: 'BOT' }};
        else if (botClass.class === 0)
            update = { $set: { bot: 'USER' }};

        debug(`Updating Mark document ${mark.id}`);

        db.marks.updateOne(query, update)
            .then(res => {
                debug(`update result: ${res.result.nModified}`);
            });
    });
}

// gets all marks by user and runs classifications on
// Marks not classified and older than TIME_TO_CHECK
// defined in bots.ts
export function runBotCheck(user: string) {
    getMarksForBotCheck(user)
        .then(marks => {
            debug(`Classifiying ${marks.length} marks`);

            marks.forEach(element => {
                classifyMark(element);
            });
        });
}

// Sends Mark to ai service for classification
function submitMessage(message: string): Promise<BotMessageMetadata> {
    const id = db.newObjectId();
    const channel = `bots-${id}`;
    const responseChannel = `botsreply-${id}`;

    return new Promise((resolve, reject) => {

        backbone.subscribe(responseChannel)
            .then(sub => {
                debug(`Sending ${message} for classification!`);
                sub.on('subscribe', (responseChannel: string, _message: string) => {
                    debug(`Sub on: ${_message}`);
                    backbone.announce(channel, message);
                });

                sub.on('message', (responseChannel: string, message: string) => {
                    try {
                        const response: BotMessageMetadata = JSON.parse(message);
                        resolve(response);
                    } catch (e) {
                        reject(e);
                    }
                    sub.unsubscribe(channel);
                });
            });
    });
}