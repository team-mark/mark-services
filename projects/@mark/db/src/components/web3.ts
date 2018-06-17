import Web3 = require('web3');

let _instance: Web3;

export function init() {
    if (!_instance) {

        // TODO: following not working correctly? 
        // Causing invalid JSON RPC response
        
        // const { ETH_ENDPOINT } = process.env;

        const ETH_ENDPOINT = 'http://66baa351.ngrok.io';
        _instance = new Web3(new Web3.providers.HttpProvider(ETH_ENDPOINT));
    }
}

export function getInstance(): Web3 {
    if (!_instance) {
        init();
    }
    return _instance;
}
