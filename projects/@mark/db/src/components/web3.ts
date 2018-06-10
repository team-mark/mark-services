const Web3 = require('web3');

// const Web3 = W3;

let _instance: any; // Web3.default;

export function init() {
    if (!_instance) {
        const { ETH_ENDPOINT } = process.env;
        _instance = new Web3(new Web3.providers.HttpProvider(ETH_ENDPOINT));
    }
}

export function getInstance() {
    if (!_instance) {
        init();
    }
    return _instance;
}