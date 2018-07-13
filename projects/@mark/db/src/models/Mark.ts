// Database Interface for the Marks (Post) collection
import { bots } from '@mark/data-utils';
import { authentication } from '@mark/utils';
import { mongoDb, ipfs } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';
import { User } from './User';
import { IpfsPost } from './IpfsPost';
import { EthereumPost } from './EthereumPost';
import { addIpfsPost, getManyIpfsPosts } from '../components/ipfs';
import { IUserDb } from './User';
import { ethereum } from '../components';
import { UpdateWriteOpResult } from 'mongodb';
const debug = require('debug')('mark:Mark');
import * as util from 'util';

export interface IMarkConsumer extends IModelConsumer {
    ethereum_id: string;
    owner: string;
    body: string;
    score?: number;
}

export interface IMarkDb extends IModelDb {
    // id: mongo.ObjectID;
    owner: string;
    ethereum_id: string;
    ipfs_id: string;
}

const COLLECTION_NAME = 'marks';

// 5/30/2018 around 1:06 in Unix epoch time
const TIME_CONST = 1527699872;

export class Mark extends Model<IMarkDb, IMarkConsumer> {
    private marks: mongoDb.ICollection<Mark>;
    // this.users: mongoDb.ICollectionDb
    private users: User;

    public constructor() {
        super(COLLECTION_NAME);
        this.users = new User();

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

    public static map(mark: IMarkDb & { body: string }): IMarkConsumer {
        const mapped: IMarkConsumer = {
            id: mark._id.toString(),
            ethereum_id: mark.ethereum_id,
            body: mark.body,
            owner: mark.owner,
            createdAt: mark.createdAt.toDateString(),
        };

        return mapped;
    }

    // Assembles IMarkConsumers given a list of MongoDb Mark documents
    private static assembleMarks(marks: IMarkDb[]): Promise<IMarkConsumer[]> {
        const hashes: string[] = [];
        const consumer: IMarkConsumer[] = [];

        marks.forEach((mark, index) => {
            hashes.push(mark.ethereum_id);
            consumer.push(Mark.map(mark));
        });

        return getManyIpfsPosts(hashes)
            .then(ipfs_posts => {
                for (let i = 0; i < ipfs_posts.length; i++) {
                    consumer[i].body = ipfs_posts[i].content;
                    consumer[i].owner = ipfs_posts[i].author;
                }
                return Promise.resolve(consumer);
            });
    }

    /**
     * Returns Marks by time created
     * @param sort      -1 for descending sort 1 for ascending sort
     * @param skip      Number of records to skip
     * @param size      Number of records to return
    */
    public getMarks(sort: number, skip: number, size: number, query?: mongoDb.IFilter): Promise<IMarkConsumer[]> {
        const cursor: mongoDb.ICursor<IMarkDb> = this.collection.find(query);

        if (sort === 1 || sort === -1)
            cursor.sort({ createdAt: sort });
        cursor.skip(skip);
        cursor.limit(size);

        return cursor.toArray()
            .then(marks => {
                return Mark.assembleMarks(marks);
            }, error => {
                console.log(error);
                return Promise.reject(new Error('Internal error'));
            });
    }

    public getMarksAggregate(query: mongoDb.IFilter<IMarkDb>[], skip?: number, size?: number): Promise<IMarkConsumer[]> {
        const cursor: mongoDb.IAggregationCursor<IMarkDb> = this.aggregate(query);

        if (skip)
            cursor.skip(skip);
        if (size)
            cursor.limit(size);

        return cursor.toArray()
            .then(marks => {
                return Mark.assembleMarks(marks);
            });
    }

    /**
     *
     * @param handle
     * @param opts
     */
    public listFeed(
        handle: string,
        opts?: {
            limit?: number,
            nextField?: string
            nextId?: string
            nextDirection?: mongoDb.NextQueryDirection
        }) {
        //      : Promise<{
        //     items: IMarkConsumer[],
        //     nextId: string,
        // }> {

        const DEFAULT_LIMIT = 100;
        const postOwners: string[] = [];

        // const filter = { $or: [{ owner: { $in: postOwners } }] };
        const filter = { owner: { $in: postOwners } };
        const options = {};
        const sort = {};
        const { nextDirection, nextField, nextId } = opts;
        let { limit } = opts;
        limit = limit | DEFAULT_LIMIT;

        let consumableMarks: IMarkConsumer[] = [];

        debug('get following');
        return this.users.getFollowing(handle)
            .then(following => {
                debug('following', following);

                following
                    .map(f => f.following)
                    .concat(handle)
                    .forEach(f => postOwners.push(f));

                debug('postOwners', postOwners);
                debug('now query', util.inspect(filter, true, undefined));
                return this.query<IMarkDb>(
                    filter,
                    options,
                    sort,
                    limit,
                    nextField,
                    nextId,
                    nextDirection
                );
            })
            .then(marksMeta => {

                debug('markMeta', marksMeta);
                const { nextId } = marksMeta;
                consumableMarks = marksMeta.items as any;

                if (consumableMarks.length === 0) {
                    return Promise.resolve({
                        items: [],
                        next: undefined
                    });
                }

                const hashes = marksMeta.items.map(m => m.ipfs_id);

                return ipfs.getManyIpfsPosts(hashes)
                    .then(ipfsPosts => {

                        debug('ipfsPosts');

                        // Update consumable marks content
                        ipfsPosts.forEach((post, index) => {
                            consumableMarks[index].body = post.content;
                            // consumableMarks[index].owner = post.author;
                        });

                        return Promise.resolve({
                            items: consumableMarks,
                            nextId
                        });
                    });
            })
            .catch(error => debug(error));
    }

    public getByOwner(handle: string): Promise<IMarkDb[]> {
        const filter = { owner: handle };
        return this.findMany(filter);
    }

    /**
     * Post mark to IPFS, Ethereum, and Mark.
     * @param content post content
     * @param user user record
     * @param passwordh password hash
     */
    public create(content: string, user: IUserDb, passwordh: string): Promise<IMarkDb> {
        // 1. get Ethereum private key
        // 1. get Ethereum private key
        // 2. post to IPFS
        // 3. post to Ethereum
        // 4. record entry in Mongo

        debug('new content being created');
        debug('content', content);
        debug('user', user);
        debug('passwordh', passwordh);

        const { handle, refPK, _id, address } = user;
        const post = new IpfsPost(handle, new Date(), content);

        const userId = User.mapId(_id);

        const mark: IMarkDb = {
            owner: handle,
            // filled in below
            ethereum_id: undefined,
            ipfs_id: undefined
        };

        // bots.submitMessage(content)
        //     .then(() => authentication.getLinkPK(userId, handle, passwordh))
        return authentication.getLinkPK(userId, handle, passwordh)
            .then(linkPK => {

                debug('linkPK', linkPK);
                const privateKey = authentication.getPrivateKey(linkPK, refPK);
                debug('privateKey', privateKey);

                // TODO: Add in bots.submitMessage
                return addIpfsPost(post)
                    .then(ipfsHash => {
                        debug('ipfsHash', ipfsHash);

                        mark.ipfs_id = ipfsHash;

                        const ethPost = new EthereumPost(ipfsHash);
                        return ethereum.addEthereumPost(ethPost, address, privateKey);
                    });
            })
            .then(txHash => {
                debug('txHash', txHash);

                mark.ethereum_id = txHash;

                return this.insertOne(mark);
            });
    }

    public updateOne(query: mongoDb.IFilter, update: mongoDb.IFilter): Promise<UpdateWriteOpResult> {
        return this.collection.updateOne(query, update);
    }
}
