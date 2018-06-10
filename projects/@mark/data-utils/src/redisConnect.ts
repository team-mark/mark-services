import * as redis from 'redis';
import { lock } from '@mark/utils';
const debug = require('debug')('mark:redis');

const {
    REDIS_PORT,
    REDIS_HOST: host,
    REDIS_SECRET
 } = process.env;
const port = +REDIS_PORT;
const options = {};

let _instance: redis.RedisClient;
let _subscriber: redis.RedisClient;

function instanceReady() { return !!_instance; }
function subscriberReady() { return !!_instance; }

let instanceMutex: lock.Mutex;
let subscriberMutex: lock.Mutex;

export function init(): Promise<void> {
    return Promise.all([
        instance(),
        subscriber()
    ])
        .then(() => Promise.resolve())
        .catch(handleError);
}

function create(): Promise<redis.RedisClient> {
    return new Promise((resolve, reject) => {
        const client = redis.createClient(port, host, options);

        console.log('redis credentials', host, port, REDIS_SECRET);

        client.auth(REDIS_SECRET, (error: Error, result: string) => {
            client.on('error', handleError);
            if (result === 'OK') {
                debug('redis client connected');
                resolve(client as redis.RedisClient);
            } else {
                reject(error);
            }
        });
    });

}

export function instance(): Promise<redis.RedisClient> {
    return new Promise(resolve => {
        if (!instanceMutex) {
            instanceMutex = new lock.Mutex(instanceReady);
            instanceMutex.await(() => { resolve(_instance); });
            return create()
                .then(client => {
                    _instance = client;
                    instanceMutex.ready();
                    // return Promise.resolve(_instance);
                });
        } else {
            instanceMutex.await(() => { resolve(_instance); });
        }
    });
}

export function subscriber(): Promise<redis.RedisClient> {
    return new Promise(resolve => {
        if (!subscriberMutex) {
            subscriberMutex = new lock.Mutex(subscriberReady);
            subscriberMutex.await(() => { resolve(_subscriber); });
            return create()
                .then(client => {
                    _subscriber = client;
                    subscriberMutex.ready();
                    return Promise.resolve(_subscriber);
                });
        } else {
            subscriberMutex.await(() => { resolve(_subscriber); });
        }
    });
}

function handleError(error: Error) {
    debug(error);
}