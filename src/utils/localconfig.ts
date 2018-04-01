import * as fs from 'fs';
const LOCALCONFIG_FILE_NAME = './localconfig.json';
let _config: any;
const debug = require('debug')('api-shell:localconfig:');

/**
 * Run local configuration setup
 * Add local configuration to _config.
 */
export function setup() {
    if (!_config) {
        debug('loading local configuration');
        loadLocalConfig();
        setupEnvVars();
    } else
        debug('local configuration already loaded');

    function loadLocalConfig() {
        try {
            _config = JSON.parse(fs.readFileSync(LOCALCONFIG_FILE_NAME, 'utf8'));
        } catch (error) {
            debug(error);
            _config = {};
        }
    }
}

/**
 * Load _config settings into process environment variables.
 */
function setupEnvVars() {
    try {
        if (_config['process.env']) {
            Object.keys(_config['process.env']).forEach(key => {
                process.env[key] = _config['process.env'][key];
            });
        }
    } catch (error) { debug(error); }
}

/**
 * Determine mode of operation by existence of localconfig.json
 */
export function isInDevelopmentMode(): boolean {
    return _config === undefined ? false : true;
}