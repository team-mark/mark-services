import Model, { IModelConsumer, IModelDb } from './Model';
import { cryptoLib } from '@mark/utils';

export interface ITokenConsumer extends IModelConsumer {
    token: string;
}
export interface ITokenDb extends IModelDb {
    token: string;
    refT: string;
    linkA: string;
    owner: string; // handle
}

const COLLECTION_NAME = 'tokens';

export class Token extends Model<ITokenDb, ITokenConsumer> {
    public constructor() {
        super(COLLECTION_NAME);
    }

    public whitelist(refT: string, linkA: string, handle: string): Promise<ITokenDb> {
        const TOKEN_LENGTH = 64;
        return cryptoLib.generateSecureCode(cryptoLib.AUTH_CODE_CHARS, TOKEN_LENGTH, true)
            .then(tokenString => {

                const token: ITokenDb = {
                    token: tokenString,
                    refT,
                    linkA,
                    owner: handle
                };
                return this.insertOne(token);
            });
    }

    public getById(id: string) {
        return this.getByToken(id);
    }

    public getByToken(token: string) {
        const filter = { token };
        return this.findOne(filter);
    }

    public static mapForConsumer(tokenRecord: Partial<ITokenDb>): ITokenConsumer {
        return {
            token: tokenRecord.token
        };
    }
}
