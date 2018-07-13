// const Web3 = require('web3');
import * as web3 from 'web3';
import { BlockWithTransactionData, Transaction, TransactionReceipt } from 'ethereum-types';
import * as BigNumber from 'bignumber.js';
// import { Block, Transaction, TransactionReceipt, Signature, } from 'web3/types';
// import { Block, Transaction, TransactionReceipt,  } from 'web3/types';
// import { Block, Transaction, TransactionReceipt } from 'web3';
const debug = require('debug')('mark:ethereum');

import { EthereumPost } from '../models/EthereumPost';
import { getInstance } from './web3';
import { resolve } from 'url';

const txValue = 1; // Value in 'Wei'. 1 Wei = 1x10^-18 Ether
const txGasPrice = 1;
const ethChainId = 112358;

/**
 * Signs and sends a transaction to the Ethereum network.
 * @param post mark post item
 * @param address ethereum wallet to post with
 * @param key key to sign with
 */
export function addEthereumPost(post: EthereumPost, address: string, key: string): Promise<string> {
    return new Promise((resolve, reject) => {
        createRawPostTx(post, address, key)
            .then((signedPostTx: string) => {

                debug('raw tx', signedPostTx);

                return getInstance().eth.sendSignedTransaction(signedPostTx, (error, transactionHash) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(transactionHash);
                    }
                });
            });
    });
}

// Returns undefined if the transaction does not contain a valid EthereumPost.
export function getEthereumPost(txHash: string): Promise<EthereumPost> {
    return new Promise((resolve, reject) => {
        getInstance().eth.getTransaction(txHash, (error, tx) => {
            if (error) {
                reject(error);
            }

            if (tx.input !== '0x') {
                const post: EthereumPost = <EthereumPost>JSON.parse(getInstance().utils.toAscii(tx.input));
                return Promise.resolve(post);
            }
        });
    });
}

// Return the most recently published block
export function getNewestBlock(): Promise<BlockWithTransactionData> {
    const returnTransactionObjects = true;

    return new Promise((resolve, reject) => {

        getInstance().eth.getBlockNumber((error, blockNumber) => {
            if (error) {
                reject(error);
            } else {
                getInstance().eth.getBlock(blockNumber, returnTransactionObjects, (error, blockObj) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(blockObj);
                    }
                });
            }

        });
    });
}

export function getBlock(blockHashOrBlockNumber: string | number): Promise<BlockWithTransactionData> {
    return new Promise((resolve, reject) => {
        getInstance().eth.getBlock(blockHashOrBlockNumber, true, (error, blockObj) => {
            if (error) {
                reject(error);
            } else {
                resolve(blockObj);
            }
        });
    });
}

export function getBalance(address: string): Promise<string> {
    return new Promise((resolve, reject) => {
        getInstance().eth.getBalance(address, (error, bal) => {
            if (error) {
                reject(error);
            } else {
                resolve(bal.toString());
            }
        });
    });
}

export function getGasPrice(): Promise<string> {
    return new Promise((resolve, reject) => {
        getInstance().eth.getGasPrice((error, gasprice) => {
            if (error) {
                reject(error);
            } else {
                resolve(gasprice.toString());
            }
        });
    });
}

export function fundAccount(address: string): Promise<{
    tx: web3.SignedTransaction,
    hash: string
}> {

    const accountNumber = Math.floor(Math.random() * 2 + 1); // 1 or 2 always;

    // const ownerAccount = process.env[`ADMIN_ETH_ACC${accountNumber}`];
    // const privateKey = process.env[`ADMIN_ETH_PASS${accountNumber}`];
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
                return getInstance().eth.sendSignedTransaction(rawTransaction, (error, transactionHash) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({
                            tx,

                            hash: transactionHash
                        });
                    }
                });
            });
    });
}

/**
 *
 * @param post item being posted
 * @param address address (wallet) being posted with
 * @param privateKey address' private key
 */
function createRawPostTx(post: EthereumPost, address: string, privateKey: string): Promise<string> {

    const inputData: string = getInstance().utils.toHex(JSON.stringify(post));
    const txGas = 21000 + (68 * (inputData.length / 2));

    const tx: Transaction = {
        to: address,
        value: txValue,
        gas: txGas,
        gasPrice: txGasPrice,
        chainId: ethChainId, // chainId is not in transaction structure per typings (web3 expects it);
        data: inputData
        // 'from' automatically set to address
        // 'nonce' automatically calculated
    } as any;

    return getInstance().eth.accounts.signTransaction(tx, privateKey)
        .then(signedTx => {

            try {
                // Format the signed transaction
                const validJson = JSON.stringify(signedTx);
                const rawTx = JSON.parse(validJson).rawTransaction;

                return Promise.resolve(rawTx);

            } catch (error) {
                return Promise.reject(error);
            }
        });

}

/**
 *
 * @param etherAmount amount of Ether to be transferred
 * @param to address (wallet) to send Ether to
 * @param from address (wallet) to send Ether from
 * @param privateKey froms private key
 */
function createSignedFundingTx(etherAmount: number, to: string, from: string, privateKey: string) {

    const txGas = 21000;
    // const txGas = 1;

    const tx: Transaction = {
        to,
        from,
        value: getInstance().utils.toWei(etherAmount.toString(), 'ether'),
        gas: txGas,
        gasPrice: txGasPrice,
        chainId: ethChainId, // chainId is not in transaction structure per typings (web3 expects it);
    } as any;

    return getInstance().eth.accounts.signTransaction(tx, privateKey)
        .then(signedTx => {

            try {
                // Format the signed transaction
                const validJson = JSON.stringify(signedTx);
                // const rawTx = JSON.parse(validJson).rawTransaction;

                return Promise.resolve(signedTx);

            } catch (error) {
                return Promise.reject(error);
            }
        });

}