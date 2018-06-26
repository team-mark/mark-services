// Database Interface for the Marks (Post) collection
import { bots } from '@mark/data-utils';
import { mongoDb } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';
import { IpfsPost } from './IpfsPost';
import { addIpfsPost, getManyIpfsPosts } from '../components/ipfs';
import { IUserDb } from './User';

export interface IMarkConsumer extends IModelConsumer {
    // id: string;
    ethereum_id: string;
    author: string;
    body: string;
    score?: number;
    // likes: number;
    // dislikes: number;
}
export interface IMarkDb extends IModelDb {
    // id: mongo.ObjectID;
    ethereum_id: string;
}

const COLLECTION_NAME = 'marks';

// 5/30/2018 around 1:06 in Unix epoch time
const TIME_CONST = 1527699872;

export class Mark extends Model<IMarkDb, IMarkConsumer> {
    private marks: mongoDb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.marks = this.collection;
    }

    // 11.7.1.1 Algortihm 2 as defined in Mark Design Document
    // z value is hard coded to 1.96 for a confidence level of 0.95
    // http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
    private static calculatePopularity(likes: number, totalVotes: number, time: Date): number {
        const z = 1.96;

        if (totalVotes === 0)
            return 0;

        const phat = 1.0 * likes / totalVotes;

        return (phat + z * z / (2 ** totalVotes) - z *
            ((phat * (1 - phat) + z * z / (4 * totalVotes)) / totalVotes) ** 0.5) /
            (1 + z * z / totalVotes);
    }

    // Algorithm 3 and 4 as defined in Mark design Document
    // set newer to true when newer Marks should have a higher score
    // set newer to false when older Marks should have a higher score
    private static timeWeightedPopularity(popularity: number, time: number, newer: boolean): number {
        if (newer)
            return Math.log10(popularity) + (time - TIME_CONST) / 4500;
        else
            return Math.log10(popularity) + 4500 / (time - TIME_CONST);
    }

    public static map(mark: IMarkDb): IMarkConsumer {

        const mapped: IMarkConsumer = {
            id: mark._id.toString(),
            ethereum_id: mark.ethereum_id,
            body: null,
            author: null,
        };

        return mapped;
    }

    public retrieveMarks(): Promise<IMarkConsumer[]> {
        const filter: mongoDb.IFilter<IMarkDb> = {};
        const consumer: IMarkConsumer[] = [];
        return this.findMany({})
            .then(post_mdb => {
                const hashes: string[] = [];
                post_mdb.forEach((mark_mdb, index) => {
                    hashes.push(mark_mdb.ethereum_id);
                    consumer.push(Mark.map(mark_mdb));
                });
                return getManyIpfsPosts(hashes)
                    .then(ipfs_posts => {
                        for (let i = 0; i < ipfs_posts.length; i++) {
                            consumer[i].body = ipfs_posts[i].content;
                            consumer[i].author = ipfs_posts[i].author;
                        }
                        return Promise.resolve(consumer);
                    });
            });
    }

    public postMark(content: string, user: string): Promise<IMarkDb> {
        const post = new IpfsPost(user, new Date(), content);
        
        // TODO: Add in bots.submitMessage
        return addIpfsPost(post)
            .then(hash => {
                const mark: IMarkDb = {
                    ethereum_id: hash
                };
                return this.insertOne(mark);
            });
    }
}
