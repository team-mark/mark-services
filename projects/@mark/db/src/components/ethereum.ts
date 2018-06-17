import Web3 = require('web3');
import { Block, Transaction, TransactionReceipt, Signature } from 'web3/types';
import { EthereumPost } from '../models/EthereumPost';
import { getInstance } from './web3';

const txValue = 1;
const txGasPrice = 1;
const ethChainId = 112358;

// Signs and sends a transaction to the Ethereum network.
export function addEthereumPost(post: EthereumPost, address: string, key: string): Promise<TransactionReceipt> {

    return createRawTx(post, address, key)
        .then((rawTx: string) => {
            return getInstance().eth.sendSignedTransaction(rawTx);
        })
        .then((receipt: any) => {
            return Promise.resolve(receipt);
        });
}

// Returns undefined if the transaction does not contain a valid EthereumPost.
export function getEthereumPost(txHash: string): Promise<EthereumPost> {

    return getInstance().eth.getTransaction(txHash)
        .then((tx: Transaction) => {

            if (tx.input !== '0x') {
                const post: EthereumPost = <EthereumPost>JSON.parse(getInstance().utils.toAscii(tx.input));
                return Promise.resolve(post);
            }
        });
}

// Return the most recently published block
export function getNewestBlock(): Promise<Block> {

    return getInstance().eth.getBlockNumber()
        .then(blockNum => {
            return getInstance().eth.getBlock(blockNum);
        });
}

// Returns a raw signed transaction string
function createRawTx(post: EthereumPost, address: string, key: string): Promise<string> {

    const inputData: string = getInstance().utils.toHex(JSON.stringify(post));
    const txGas = 21000 + (68 * (inputData.length / 2));

    const tx = {
        to: address,
        value: txValue,
        gas: txGas,
        gasPrice: txGasPrice,
        chainId: ethChainId,
        data: inputData
        // 'from' automatically set to address
        // 'nonce' automatically calculated
    };

    return (<Promise<string>> getInstance().eth.accounts.signTransaction(tx, key, false))
        .then((signedTx: string) => {

            // Format the signed transaction
            const validJson = JSON.stringify(signedTx);
            const rawTx = JSON.parse(validJson).rawTransaction;

            return Promise.resolve(rawTx);
        });
}
