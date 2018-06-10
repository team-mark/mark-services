// Database Interface for the Marks (Post) collection

import { mongoDb } from '../components';
import * as mongo from 'mongodb';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IMarkConsumer extends IModelConsumer {
    id: string;
    ethereum_id: string;
    time: Date;
    score: number;
    likes: number;
    dislikes: number;
}
export interface IMarkDb extends IModelDb {
    id: mongo.ObjectID;
    ethereum_id: string;
    likes: mongo.ObjectID[];
    dislikes: mongo.ObjectID[];
    time: Date;
}

const COLLECTION_NAME = 'marks';

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

    public static map(mark: IMarkDb): IMarkConsumer {
        const numLikes = mark.likes.length;
        const numDislikes = mark.dislikes.length;
        const _score = Mark.calculatePopularity(numLikes,
                                                numLikes + numDislikes,
                                                mark.time);

        const mapped: IMarkConsumer = {
            id: mark._id.toString(),
            ethereum_id: mark.ethereum_id,
            likes: mark.likes.length,
            dislikes: mark.dislikes.length,
            score: _score,
            time: mark.time
        };

        return mapped;
    }

    public retrieveMarks(): Promise<IMarkDb[]> {
        const filter: mongoDb.IFilter<IMarkDb> = {};
        return this.findMany({});
    }

    public postMark(doc: any): Promise<mongo.InsertOneWriteOpResult> {
        return this.insertOne(doc);

        
    }
}
