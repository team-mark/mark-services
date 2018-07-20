"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backbone = require("./backbone");
const db = require("@mark/db");
const debug = require('debug')('mark:bots');
const TIME_TO_CHECK = 1;
function getMarksForBotCheck(user) {
    const date = new Date();
    date.setHours(date.getHours() - TIME_TO_CHECK);
    const query = { createdAt: { $lt: date }, bot: 'UNKNOWN', owner: user };
    return db.marks.getMarks(1, 0, 50, query);
}
function classifyMark(mark) {
    debug(`Classifying ${mark.body}`);
    const response = submitMessage(mark.body);
    response.then(botClass => {
        const query = { _id: new db.ObjectID(mark.id) };
        let update = {};
        debug(`Classifier response: ${botClass.class}`);
        if (botClass.class === 1)
            update = { $set: { bot: 'BOT' } };
        else if (botClass.class === 0)
            update = { $set: { bot: 'USER' } };
        debug(`Updating Mark document ${mark.id}`);
        db.marks.updateOne(query, update)
            .then(res => {
            debug(`update result: ${res.result.nModified}`);
        });
    });
}
function runBotCheck(user) {
    getMarksForBotCheck(user)
        .then(marks => {
        debug(`Classifiying ${marks.length} marks`);
        marks.forEach(element => {
            classifyMark(element);
        });
    });
}
exports.runBotCheck = runBotCheck;
function submitMessage(message) {
    const id = db.newObjectId();
    const channel = `bots-${id}`;
    const responseChannel = `botsreply-${id}`;
    return new Promise((resolve, reject) => {
        backbone.subscribe(responseChannel)
            .then(sub => {
            debug(`Sending ${message} for classification!`);
            sub.on('subscribe', (responseChannel, _message) => {
                debug(`Sub on: ${_message}`);
                backbone.announce(channel, message);
            });
            sub.on('message', (responseChannel, message) => {
                try {
                    const response = JSON.parse(message);
                    resolve(response);
                }
                catch (e) {
                    reject(e);
                }
                sub.unsubscribe(channel);
            });
        });
    });
}