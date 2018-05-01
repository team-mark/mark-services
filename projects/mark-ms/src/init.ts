import * as mdb from '@mark/mdb';
import * as utils from '../node_modules/@mark/utils';
const debug = require('debug')('mark:init');

export function init() {
    return Promise.all([mdb.init()])
        .then(() => Promise.resolve());
}