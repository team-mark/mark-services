import { mongoDb, W3 } from '../components';
import { cryptoLib } from '@mark/utils';
import Model, { IModelConsumer, IModelDb } from './Model';

export interface IAccountConsumer extends IModelConsumer {
    handle: string;
    // privateKeyH: string;
    public_key: string;
    address: string;
    // link_a: string;
    // ref_a: string;
}
export interface IAccountDb extends IModelDb {
    handle: string;
    privateKeyH: string;
    publicKey: string;
    address: string;
    linkI: string;
    refA: string;
}

export interface IEthereumAccount {
    address: string; // "0xb8CE9ab6943e0eCED004cDe8e3bBed6568B2Fa01",
    privateKey: string; // "0x348ce564d427a3311b6536bbcff9390d69395b06ed6c486954e971d960fe8709",
    signTransaction: Function; // function(tx){...},
    sign: Function; // function(data){...},
    encrypt: Function; // function(password){...}
}

const COLLECTION_NAME = 'accounts';

export class Account extends Model<IAccountDb, IAccountConsumer> {
    private wallets: mongoDb.ICollection;

    public constructor() {
        super(COLLECTION_NAME);
        this.wallets = this.collection;
    }

    public create(handle: string, linkI: string, refA: string, linkR: string): Promise<IAccountDb> {

        const web3 = W3.getInstance();
        const ethWallet = web3.eth.accounts.create();

        return cryptoLib.hash(linkR, ethWallet.privateKey.length)
            .then(hashedLinkR => {

                const encryptedPrivateKey = cryptoLib.XORStrings(hashedLinkR, ethWallet.privateKey);
                const account: IAccountDb = {
                    handle,
                    privateKeyH: encryptedPrivateKey,
                    publicKey: ethWallet.publicKey,
                    address: ethWallet.address,
                    linkI,
                    refA,
                };

                return this.insertOne(account);
            });

    }
}
