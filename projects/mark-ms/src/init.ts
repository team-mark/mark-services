import * as mdb from '@mark/mdb';
const debug = require('debug')('mark:init');

debug('calling ms init');

console.log('loading mdb init');
console.log(mdb);

export function init() {
    console.log('calling init mdb');
    debug(mdb);

    return Promise.all([mdb.init()])
        .then(() => Promise.resolve());
}