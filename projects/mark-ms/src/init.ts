import * as db from '@mark/db';
import * as utils from '../node_modules/@mark/utils';
const debug = require('debug')('mark:init');

export function init() {
    return Promise.all([db.init()])
        .then(() => Promise.resolve());
}