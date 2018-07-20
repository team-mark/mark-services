"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require('debug')('mark:ethereum');
const web3_1 = require("./web3");
const txValue = 1;
const txGasPrice = 1;
const ethChainId = 112358;
function addEthereumPost(post, address, key) {
    return new Promise((resolve, reject) => {
        createRawPostTx(post, address, key)
            .then((signedPostTx) => {
            debug('raw tx', signedPostTx);
            return web3_1.getInstance().eth.sendSignedTransaction(signedPostTx, (error, transactionHash) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(transactionHash);
                }
            });
        });
    });
}
exports.addEthereumPost = addEthereumPost;
function getEthereumPost(txHash) {
    return new Promise((resolve, reject) => {
        web3_1.getInstance().eth.getTransaction(txHash, (error, tx) => {
            if (error) {
                reject(error);
            }
            if (tx.input !== '0x') {
                const post = JSON.parse(web3_1.getInstance().utils.toAscii(tx.input));
                return Promise.resolve(post);
            }
        });
    });
}
exports.getEthereumPost = getEthereumPost;
function getNewestBlock() {
    const returnTransactionObjects = true;
    return new Promise((resolve, reject) => {
        web3_1.getInstance().eth.getBlockNumber((error, blockNumber) => {
            if (error) {
                reject(error);
            }
            else {
                web3_1.getInstance().eth.getBlock(blockNumber, returnTransactionObjects, (error, blockObj) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(blockObj);
                    }
                });
            }
        });
    });
}
exports.getNewestBlock = getNewestBlock;
function getBlock(blockHashOrBlockNumber) {
    return new Promise((resolve, reject) => {
        web3_1.getInstance().eth.getBlock(blockHashOrBlockNumber, true, (error, blockObj) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(blockObj);
            }
        });
    });
}
exports.getBlock = getBlock;
function getBalance(address) {
    return new Promise((resolve, reject) => {
        web3_1.getInstance().eth.getBalance(address, (error, bal) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(bal.toString());
            }
        });
    });
}
exports.getBalance = getBalance;
function getGasPrice() {
    return new Promise((resolve, reject) => {
        web3_1.getInstance().eth.getGasPrice((error, gasprice) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(gasprice.toString());
            }
        });
    });
}
exports.getGasPrice = getGasPrice;
function fundAccount(address) {
    const accountNumber = Math.floor(Math.random() * 2 + 1);
    const ownerAccount = process.env.ADMIN_ETH_ACC1;
    const privateKey = process.env.ADMIN_ETH_PASS1;
    console.log('fundAccount');
    console.log('accountNumber', accountNumber);
    console.log('targetAccount', address);
    console.log('ownerAccount', ownerAccount);
    console.log('privateKey', privateKey);
    console.log('txValue', txValue);
    return new Promise((resolve, reject) => {
        const oneEther = 1;
        createSignedFundingTx(oneEther, address, ownerAccount, privateKey)
            .then(tx => {
            const { rawTransaction } = tx;
            return web3_1.getInstance().eth.sendSignedTransaction(rawTransaction, (error, transactionHash) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve({
                        tx,
                        hash: transactionHash
                    });
                }
            });
        });
    });
}
exports.fundAccount = fundAccount;
function createRawPostTx(post, address, privateKey) {
    const inputData = web3_1.getInstance().utils.toHex(JSON.stringify(post));
    const txGas = 21000 + (68 * (inputData.length / 2));
    const tx = {
        to: address,
        value: txValue,
        gas: txGas,
        gasPrice: txGasPrice,
        chainId: ethChainId,
        data: inputData
    };
    return web3_1.getInstance().eth.accounts.signTransaction(tx, privateKey)
        .then(signedTx => {
        try {
            const validJson = JSON.stringify(signedTx);
            const rawTx = JSON.parse(validJson).rawTransaction;
            return Promise.resolve(rawTx);
        }
        catch (error) {
            return Promise.reject(error);
        }
    });
}
function createSignedFundingTx(etherAmount, to, from, privateKey) {
    const txGas = 21000;
    const tx = {
        to,
        from,
        value: web3_1.getInstance().utils.toWei(etherAmount.toString(), 'ether'),
        gas: txGas,
        gasPrice: txGasPrice,
        chainId: ethChainId,
    };
    return web3_1.getInstance().eth.accounts.signTransaction(tx, privateKey)
        .then(signedTx => {
        try {
            const validJson = JSON.stringify(signedTx);
            return Promise.resolve(signedTx);
        }
        catch (error) {
            return Promise.reject(error);
        }
    });
}