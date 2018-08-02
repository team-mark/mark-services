// const Web3 = require('web3');
import * as web3 from 'web3';
import { BlockWithTransactionData, Transaction, TransactionReceipt } from 'ethereum-types';
// import { Block, Transaction, TransactionReceipt, Signature, } from 'web3/types';
// import { Block, Transaction, TransactionReceipt,  } from 'web3/types';
// import { Block, Transaction, TransactionReceipt } from 'web3';
const debug = require('debug')('mark:ethereum');

import { EthereumPost } from '../models/EthereumPost';
import { getInstance } from './web3';
import { resolve } from 'url';
import { getIpfsPost } from './ipfs';
import { IpfsPost } from '../models/IpfsPost';

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
        createSignedPostTx(post, address, key)
            .then((signedPostTx: string) => {
                return getInstance().eth.sendSignedTransaction(signedPostTx, (error: any, transactionHash: any) => {
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
        getInstance().eth.getTransaction(txHash, (error: any, tx: any) => {
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

// Returns undefined if the transaction does not contain a valid EthereumPost.
export function printPost(txHash: string): Promise<EthereumPost> {
    return new Promise((resolve, reject) => {
        getInstance().eth.getTransaction(txHash, (error, tx) => {
            if (error) {
                reject(error);
            }

            if (tx.input !== '0x') {
                const post: EthereumPost = <EthereumPost>JSON.parse(getInstance().utils.toAscii(tx.input));
                console.log('IPFS Hash: ' + post.hash);
                // return Promise.resolve(post);

                return getIpfsPost(post.hash)
                    .then((post: IpfsPost) => {
                        console.log('User Content: ' + post.content);
                    })
                    .catch((err: Error) => {
                        console.log(err);
                    }) 
            }
        });
    });
}

// Return the most recently published block
export function getNewestBlock(): Promise<BlockWithTransactionData> {
    const returnTransactionObjects = true;

    return new Promise((resolve, reject) => {

        getInstance().eth.getBlockNumber((error: any, blockNumber: any) => {
            if (error) {
                reject(error);
            } else {
                getInstance().eth.getBlock(blockNumber, returnTransactionObjects, (error: any, blockObj: any) => {
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
        getInstance().eth.getBlock(blockHashOrBlockNumber, true, (error: any, blockObj: any) => {
            if (error) {
                reject(error);
            } else {
                resolve(blockObj);
            }
        });
    });
}

export function fundAccount(targetAccount: string) {

    const accountNumber = Math.floor(Math.random() * 2 + 1); // 1 or 2 always;

    // const ownerAccount = process.env[`ADMIN_ETH_ACC${accountNumber}`];
    // const privateKey = process.env[`ADMIN_ETH_PASS${accountNumber}`];
    const ownerAccount = process.env.ADMIN_ETH_ACC1;
    const privateKey = process.env.ADMIN_ETH_PASS1;

    console.log('fundAccount');
    console.log('accountNumber', accountNumber);
    console.log('targetAccount', targetAccount);
    console.log('ownerAccount', ownerAccount);
    console.log('privateKey', privateKey);
    console.log('txValue', txValue);

    return new Promise((resolve, reject) => {
        createSignedFundingTx(txValue, targetAccount, ownerAccount, privateKey)
            .then(signedFundsTx => {
                return getInstance().eth.sendSignedTransaction(signedFundsTx, (error: any, transactionHash: any) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(transactionHash);
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
function createSignedPostTx(post: EthereumPost, address: string, privateKey: string): Promise<string> {

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
        .then((signedTx: any) => {

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
 * @param amount amount of Ether to be transferred
 * @param to address (wallet) to send Ether to
 * @param from address (wallet) to send Ether from
 * @param privateKey froms private key
 */
function createSignedFundingTx(amount: number, to: string, from: string, privateKey: string): Promise<string> {

    const txGas = 21000;

    const tx: Transaction = {
        to,
        from,
        value: getInstance().utils.toWei(amount.toString(), 'ether'),
        gas: txGas,
        gasPrice: txGasPrice,
        chainId: ethChainId, // chainId is not in transaction structure per typings (web3 expects it);
    } as any;

    return getInstance().eth.accounts.signTransaction(tx, privateKey)
        .then((signedTx: any) => {

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