import Model, { IModelConsumer, IModelDb } from './Model';

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
}