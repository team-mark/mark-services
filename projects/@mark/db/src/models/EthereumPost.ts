// Data structure to be passed and retrieved from
// the "input" field of Ethereum transactions.
export class EthereumPost {

    constructor(
        public hash: string,
        public parent?: string,
        public sibling?: string,
        public hashtag?: string[]) {
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