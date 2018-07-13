import * as Web3 from 'web3';
let _instance: Web3;

const { ETH_ENDPOINT } = process.env;

export function init() {
    if (!_instance) {

        const { ETH_ENDPOINT } = process.env;
        const provider = new Web3.providers.HttpProvider(ETH_ENDPOINT);
        _instance = new Web3(provider);
    }
}

export function getInstance() {
    if (!_instance) {
        init();
    }
    return _instance;
}
