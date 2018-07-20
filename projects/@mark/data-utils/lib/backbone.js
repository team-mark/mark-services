"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redisConnect = require("./redisConnect");
function announce(channel, message) {
    return new Promise((resolve, reject) => {
        redisConnect.instance()
            .then(redisClient => {
            redisClient.publish(channel, message, (error, reply) => {
                if (error) {
                    return reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    });
}
exports.announce = announce;
function subscribe(...channels) {
    return redisConnect.subscriber()
        .then(redisClient => {
        redisClient.subscribe(...channels);
        return Promise.resolve(redisClient);
    });
}
exports.subscribe = subscribe;
function psubscribe(...channels) {
    return redisConnect.subscriber()
        .then(redisClient => {
        redisClient.psubscribe(...channels);
        return Promise.resolve(redisClient);
    });
}
exports.psubscribe = psubscribe;