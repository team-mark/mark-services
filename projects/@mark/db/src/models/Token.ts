import Model, { IModelConsumer, IModelDb } from './Model';
import { cryptoLib } from '@mark/utils';

export interface ITokenConsumer extends IModelConsumer {
    token: string;
}
export interface ITokenDb extends IModelDb {
    token: string;
    refT: string;
    linkA: string;
}

const COLLECTION_NAME = 'tokens';

export class Token extends Model<ITokenDb, ITokenConsumer> {
    public constructor() {
        super(COLLECTION_NAME);
    }

    public whitelist(refT: string, linkA: string): Promise<ITokenDb> {
        const TOKEN_LENGTH = 64;
        return cryptoLib.generateSecureCode(cryptoLib.AUTH_CODE_CHARS, TOKEN_LENGTH, true)
            .then(tokenString => {

                const token: ITokenDb = {
                    token: tokenString,
                    refT,
                    linkA
                };
                return this.insertOne(token);
            });
    }
}