// const Web3 = require('web3');
import * as web3 from 'web3';
import { BlockWithTransactionData, Transaction, TransactionReceipt } from 'ethereum-types';
// import { Block, Transaction, TransactionReceipt, Signature, } from 'web3/types';
// import { Block, Transaction, TransactionReceipt,  } from 'web3/types';
// import { Block, Transaction, TransactionReceipt } from 'web3';

import { EthereumPost } from '../models/EthereumPost';
import { getInstance } from './web3';
import { resolve } from 'url';

const txValue = 1;
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
        createRawTx(post, address, key)
            .then((rawTxData: string) => {
                return getInstance().eth.sendSignedTransaction(rawTxData, (error, transactionHash) => {
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

/**
 *
 * @param post item being posted
 * @param address address (wallet) being posted with
 * @param privateKey address' private key
 */
function createRawTx(post: EthereumPost, address: string, privateKey: string): Promise<string> {

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
