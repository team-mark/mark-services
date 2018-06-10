import Model, { IModelConsumer, IModelDb } from './Model';
import { cryptoLib } from '../../../utils/lib/index';

export interface ITokenConsumer extends IModelConsumer {
    token: string;
}
export interface ITokenDb extends IModelDb {
    token: string;
}

const COLLECTION_NAME = 'tokens';

export class Token extends Model<ITokenDb, ITokenConsumer> {
    public constructor() {
        super(COLLECTION_NAME);
    }

    public whitelist(linkA: string): Promise<ITokenDb> {

        return cryptoLib.generateSecureCode(64)
            .then(tokenString => {

                const token: ITokenDb = {
                    token: tokenString,
                    _id: null
                };
                return this.insertOne(token);
            });
    }
}