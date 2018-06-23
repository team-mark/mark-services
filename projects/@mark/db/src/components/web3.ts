import Web3 = require('webx3');
// import * as Web3 from 'web3';

// let _instance: W3.default;

// export function init() {
//     if (!_instance) {

//         // TODO: following not working correctly?
//         // Causing invalid JSON RPC response

//         // const { ETH_ENDPOINT } = process.env;

//         const ETH_ENDPOINT = 'http://66baa351.ngrok.io';
//         const Web3 = W3.default;
//         _instance = new Web3(new Web3.providers.HttpProvider(ETH_ENDPOINT));
//     }
// }

// export function getInstance(): W3.default {
//     if (!_instance) {
//         init();
//     }
//     return _instance;
// }

// const W3 = require('web3');

let _instance: Web3;
const { ETH_ENDPOINT } = process.env;
// const DEFAULT = Web3.default;

export function init() {
    if (!_instance) {

        // TODO: following not working correctly?
        // Causing invalid JSON RPC response

        // const ETH_ENDPOINT = 'http://66baa351.ngrok.io';
        // const Web3 = W3.default;
        // _instance = new Web3(new Web3.providers.HttpProvider(ETH_ENDPOINT));

        // if (typeof _instance !== 'undefined') {
        //     _instance = new Web3(web3.currentProvider);
        //   } else {
        //     // set the provider you want from Web3.providers
        // }
        // const provider = new Web3.providers.HttpProvider(ETH_ENDPOINT);
        _instance = new Web3(new Web3.providers.HttpProvider(ETH_ENDPOINT));
    }
}

export function getInstance(): Web3 {
    if (!_instance) {
        init();
    }
    return _instance;
}
