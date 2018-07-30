import * as backbone from './backbone';
import * as db from '@mark/db';
import { IMarkConsumer } from '../../db';
import { marks, ObjectID, users } from '../../db';
import { rest } from '@mark/utils';
import * as express from 'express';

const debug = require('debug')('mark:bots');
const request = require('request');

// Time to wait until classifing Mark in Hours
const TIME_TO_CHECK = 1;

export interface BotMessageMetadata {
    class: 0 | 1;
    percentage0: number;
    percentage1: number;
}

export function captchaValidate(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const { CAPTCHA_URL, CAPTCHA_SECRET } = process.env;
    const { captcha } = req.body;

    const options = {
        url: CAPTCHA_URL,
        method: 'POST',
        json: true,
        form: {
            secret: CAPTCHA_SECRET,
            response: captcha
        }
    };

    request(options, (err: any, response: any) => {
        debug(response.body);

        if (response.body.success)
            return next();
        return rest.Response.fromUnauthorized().send(res);
    });
}

// gets counts of bot posts and user posts
// labels user as bot if the account has more bot posts
// otherwise mark as user
function classifyUser(handle: string): void {
    const query = { owner: handle, bot: 'BOT' };

    debug('Classify User');

    marks.count(query).then(botCount => {
        query.bot = 'USER';
        marks.count(query).then(userCount => {
            let update = {};

            debug(`botCount = ${botCount} userCount = ${userCount}`);

            if (botCount > userCount)
                update = { $set: { bot: true } };
            else
                update = { $set: { bot: false} };
            users.updateByHandle(handle, update);
        }).catch(err => {
            debug(err);
        });
    }).catch(error => {
        debug(error);
    });
}

// retrieves Marks that need to be classified by user
function getMarksForBotCheck(user: string): Promise<IMarkConsumer []> {
    const date = new Date();

    date.setHours(date.getHours() - TIME_TO_CHECK);
    const query = { createdAt: {$lt: date}, bot: 'UNKNOWN', owner: user};

    return marks.getMarks(1, 0, 50, query);
}

// updates Mark bot flag on mongo
function classifyMark(mark: IMarkConsumer) {
    debug(`Classifying ${mark.body}`);
    const response = submitMessage(mark.body);

    response.then(botClass => {
        const query = {_id: new ObjectID(mark.id)};
        let update = {};

        debug(`Classifier response: ${botClass.class}`);

        if (botClass.class === 1)
            update = { $set: { bot: 'BOT' }};
        else if (botClass.class === 0)
            update = { $set: { bot: 'USER' }};

        debug(`Updating Mark document ${mark.id}`);

        marks.updateOne(query, update)
            .then( res => {
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
    classifyUser(user);
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