import * as db from '@mark/db';
const debug = require('debug')('mark:init');

export function init() {
    return Promise.all([db.init()])
        .then(() => Promise.resolve());
}