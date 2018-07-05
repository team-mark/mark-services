// Data structure to be passed and retrieved from
// the "input" field of Ethereum transactions.
export class EthereumPost {

    constructor(
        private hash: string,
        private parent?: string,
        private sibling?: string,
        private hashtag?: string[]) {
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