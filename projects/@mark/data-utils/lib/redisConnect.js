"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis = require("redis");
const utils_1 = require("@mark/utils");
const debug = require('debug')('mark:redis');
const { REDIS_PORT, REDIS_HOST: host, REDIS_SECRET } = process.env;
const port = +REDIS_PORT;
const options = {};
let _instance;
let _subscriber;
function instanceReady() { return !!_instance; }
function subscriberReady() { return !!_instance; }
let instanceMutex;
let subscriberMutex;
function init() {
    return Promise.all([
        instance(),
        subscriber()
    ])
        .then(() => Promise.resolve())
        .catch(handleError);
}
exports.init = init;
function create() {
    return new Promise((resolve, reject) => {
        const client = redis.createClient(port, host, options);
        console.log('redis credentials', host, port, REDIS_SECRET);
        client.auth(REDIS_SECRET, (error, result) => {
            client.on('error', handleError);
            if (result === 'OK') {
                debug('redis client connected');
                resolve(client);
            }
            else {
                reject(error);
            }
        });
    });
}
function instance() {
    return new Promise(resolve => {
        if (!instanceMutex) {
            instanceMutex = new utils_1.lock.Mutex(instanceReady);
            instanceMutex.await(() => { resolve(_instance); });
            return create()
                .then(client => {
                _instance = client;
                instanceMutex.ready();
            });
        }
        else {
            instanceMutex.await(() => { resolve(_instance); });
        }
    });
}
exports.instance = instance;
function subscriber() {
    return new Promise(resolve => {
        if (!subscriberMutex) {
            subscriberMutex = new utils_1.lock.Mutex(subscriberReady);
            subscriberMutex.await(() => { resolve(_subscriber); });
            return create()
                .then(client => {
                _subscriber = client;
                subscriberMutex.ready();
                return Promise.resolve(_subscriber);
            });
        }
        else {
            subscriberMutex.await(() => { resolve(_subscriber); });
        }
    });
}
exports.subscriber = subscriber;
function handleError(error) {
    debug(error);
}