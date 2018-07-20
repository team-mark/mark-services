"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("@mark/db");
const debug = require('debug')('mark:init');
function init() {
    return Promise.all([db.init()])
        .then(() => Promise.resolve());
}
exports.init = init;