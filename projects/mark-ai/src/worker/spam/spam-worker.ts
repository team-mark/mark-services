import { spam } from '../../components';
import { backbone, redisConnect } from '@mark/data-utils';
const debug = require('debug')('mark');
import * as redis from 'redis';
// import { redisConnect } from '../../../../@mark/data-utils';

const MESSAGE_PASSING_CHANNEL = 'spam-message-announce-*';

let _sub: redis.RedisClient;
let _pub: redis.RedisClient;

export function init(): Promise<void> {
    return new Promise((resolve, reject) => {

        let subPromise = Promise.resolve(_sub);
        let pubPromise = Promise.resolve(_pub);

        if (_sub && _pub) {
            return resolve();
        }

        if (!_sub) {
            // subPromise = redisConnect.subscriber();
            subPromise = backbone.psubscribe(MESSAGE_PASSING_CHANNEL);
        }
        if (!_pub) {
            pubPromise = redisConnect.instance();
        }

        Promise.all([pubPromise, subPromise])
            .then(([pub, sub]) => {
                _pub = pub;
                _sub = sub;

                sub.on('subscribe', (channel: string, message: number) => {
                    debug('spam-worker ready');
                    resolve();
                });

                sub.on('pmessage', (pattern: string, channel: string, message: string) => {

                    const [_spam, _message, _announce, id] = channel.split('-');

                    spam.passToAI(id, message)
                        
                });
            });
    });
}
