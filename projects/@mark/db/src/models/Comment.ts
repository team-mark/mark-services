// Database Interface for the Comment collection
import { mongoDb } from '../components';
import Model, { IModelConsumer, IModelDb } from './Model';
import { IpfsPost } from './IpfsPost';
import { addIpfsPost, getManyIpfsPosts } from '../components/ipfs';

export interface ICommentConsumer extends IModelConsumer {
    ethereum_id: string;
    author: string;
    body: string;
}
export interface ICommentDb extends IModelDb {
    ethereum_id: string;
    postId: string;
}

const COLLECTION_NAME = 'comments';

export class Comment extends Model<ICommentDb, ICommentConsumer> {
    private comments: mongoDb.ICollection<ICommentDb>;

    public constructor() {
        super(COLLECTION_NAME);
        this.comments = this.collection;
    }

    public static map(mark: ICommentDb): ICommentConsumer {

        const mapped: ICommentConsumer = {
            id: mark._id.toString(),
            ethereum_id: mark.ethereum_id,
            body: null,
            author: null,
        };

        return mapped;
    }

    public retrieveComments(_postId: string): Promise<ICommentConsumer[]> {
        const filter: mongoDb.IFilter<ICommentDb> = { postId: _postId };
        const consumer: ICommentConsumer[] = [];

        return this.findMany(filter)
            .then(comment_mdb => {
                const hashes: string[] = [];

                comment_mdb.forEach((comment_mdb, index) => {
                    hashes.push(comment_mdb.ethereum_id);
                    consumer.push(Comment.map(comment_mdb));
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

    public postComment(author: string, _postId: string, content: string): Promise<ICommentDb> {
        const post = new IpfsPost(author, new Date(), content);
        // TODO: Add in bots.submitMessage
        return addIpfsPost(post)
            .then(hash => {
                const mark: ICommentDb = {
                    ethereum_id: hash,
                    postId: _postId
                };

                return this.insertOne(mark);
            });
    }
}
