"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const LOCALCONFIG_FILE_NAME = './localconfig.json';
let _config;
const debug = require('debug')('mark:localconfig:');
function setup() {
    if (!_config) {
        debug('loading local configuration');
        loadLocalConfig();
        setupEnvVars();
    }
    else
        debug('local configuration already loaded');
    function loadLocalConfig() {
        try {
            _config = JSON.parse(fs.readFileSync(LOCALCONFIG_FILE_NAME, 'utf8'));
        }
        catch (error) {
            debug(error);
            _config = {};
        }
    }
}
exports.setup = setup;
function setupEnvVars() {
    try {
        if (_config['process.env']) {
            Object.keys(_config['process.env']).forEach(key => {
                process.env[key] = _config['process.env'][key];
            });
        }
    }
    catch (error) {
        debug(error);
    }
}
function isInDevelopmentMode() {
    return _config === undefined ? false : true;
}
exports.isInDevelopmentMode = isInDevelopmentMode;