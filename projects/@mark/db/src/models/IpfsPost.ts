// Data structure to be passed and retrieved from IPFS.
export class IpfsPost {

    author: string;
    time: Date;
    content: string;

    public constructor(author: string, time: Date, content: string) {
        this.author = author;
        this.time = time;
        this.content = content;
    }

    public toJSON(): object {
        return {
            author: this.author,
            time: this.time,
            content: this.content
        };
    }
}
