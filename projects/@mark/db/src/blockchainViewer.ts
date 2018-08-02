import { BlockWithTransactionData, Transaction, TransactionReceipt } from 'ethereum-types';
import { EthereumPost } from './models/EthereumPost';
import { getNewestBlock, getEthereumPost, addEthereumPost, fundAccount, printPost, getBlock } from './components/ethereum';
// import { getBlock } from '../lib/components/ethereum';

const node1miner = '0x7cff892dc9ee4fdb3f1b25f6b6ede1198c285812';
const node2miner = '0xE6bF354295B3269059C4Fd20D2AB9C648e9faE19';

let currentBlock: number;

getNewestBlock()
    .then((block: BlockWithTransactionData) => {

        currentBlock = block.number;
        console.log('Starting blockchain viewer at block # ' + currentBlock);

        setInterval(() => {
            getBlockData();
        }, 1000);
    })
    .catch((err: Error) => {
        console.error(err);
    });

async function getBlockData() {
    await getBlock(currentBlock + 1)
                .then((block: BlockWithTransactionData) => {

                    if (block !== null) {

                        console.log('------------------------------------------------------------------------------');

                        console.log('Block #' + block.number + ' mined by Node #' + ((block.miner === node1miner) ? '1' : '2') + '\n');

                        if (block.transactions.length === 0)
                            console.log('Empty Block!');
                        else {
                            for (var j = 0; j < block.transactions.length; j++) {

                                const tx: Transaction = block.transactions[j];

                                console.log('Transaction #' + (j + 1) + ':');

                                if (tx.value.toString() === '1000000000000000000') {
                                    console.log('Funding account: ' + tx.to);
                                }

                                printPost(tx.hash)
                                    .then((post: EthereumPost) => {
                                        // console.log(post);
                                    })
                                    .catch((err: Error) => {
                                        console.error(err);
                                    });
                            }
                        }
                        currentBlock += 1;
                    } 
                })
                .catch((err: Error) => {
                    // console.error(err);
                });
}


