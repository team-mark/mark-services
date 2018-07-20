"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Web3 = require("web3");
let _instance;
const { ETH_ENDPOINT } = process.env;
function init() {
    if (!_instance) {
        const { ETH_ENDPOINT } = process.env;
        const provider = new Web3.providers.HttpProvider(ETH_ENDPOINT);
        _instance = new Web3(provider);
    }
}
exports.init = init;
function getInstance() {
    if (!_instance) {
        init();
    }
    return _instance;
}
exports.getInstance = getInstance;