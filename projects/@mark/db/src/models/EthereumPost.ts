// Data structure to be passed and retrieved from
// the "input" field of Ethereum transactions.
export class EthereumPost {
    hash: string;
    parent?: string;
    sibling?: string;
    hashtag?: string[];

    constructor(ipfsHash: string) {
        this.hash = ipfsHash;
    }

    toJSON(): object {
        return {
            hash: this.hash,
            parent: this.parent,
            sibling: this.sibling,
            hashtags: this.hashtag
        };
    }
}