"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backbone = require("./backbone");
const db = require("@mark/db");
function submitMessage(message) {
    const id = db.newObjectId();
    const channel = `bots-${id}`;
    const responseChannel = `botsreply-${id}`;
    return new Promise((resolve, reject) => {
        backbone.subscribe(responseChannel)
            .then(sub => {
            sub.on('subscribe', (responseChannel, message) => {
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
exports.submitMessage = submitMessage;