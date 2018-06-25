import * as W3 from 'web3';
const Web3 = require('web3');

let _instance: W3.default;

export function init() {
    if (!_instance) {
        const { ETH_ENDPOINT } = process.env;
        _instance = new Web3();
        _instance.setProvider(new _instance.providers.HttpProvider(ETH_ENDPOINT));
    }
}

export function getInstance(): W3.default {
    if (!_instance) {
        init();
    }
    return _instance;
}