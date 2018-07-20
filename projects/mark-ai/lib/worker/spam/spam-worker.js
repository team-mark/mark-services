"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("../../components");
const data_utils_1 = require("@mark/data-utils");
const debug = require('debug')('mark:spam-worker');
const debugV = require('debug')('mark-sys:spam-worker');
const MESSAGE_PASSING_CHANNEL = 'spam-message-announce-*';
let _sub;
let _pub;
function init() {
    return new Promise((resolve, reject) => {
        debugV('spam-worker init');
        let subPromise = Promise.resolve(_sub);
        let pubPromise = Promise.resolve(_pub);
        if (_sub && _pub) {
            return resolve();
        }
        if (!_sub) {
            subPromise = data_utils_1.backbone.psubscribe(MESSAGE_PASSING_CHANNEL);
        }
        if (!_pub) {
            pubPromise = data_utils_1.redisConnect.instance();
        }
        Promise.all([pubPromise, subPromise])
            .then(([pub, sub]) => {
            _pub = pub;
            _sub = sub;
            sub.on('subscribe', (channel, message) => {
                debugV('spam-worker ready');
                resolve();
            });
            sub.on('pmessage', (pattern, channel, message) => {
                debugV('spam-worker ready');
                const [_spam, _message, _announce, id] = channel.split('-');
                components_1.spam.passToAI(id, message);
            });
        });
    });
}
exports.init = init;