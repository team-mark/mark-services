

import * as BigNumber from 'bignumber.js';
import {
    AbiDefinition,
    BlockWithTransactionData,
    BlockWithoutTransactionData,
    BlockParam,
    CallData,
    Provider,
    Unit,
    TxData,
    Transaction,
    ContractAbi,
    TransactionReceipt,
    FilterObject,
    LogEntryEvent,
    JSONRPCRequestPayload,
    JSONRPCResponsePayload,
    TransactionTrace,
} from 'ethereum-types';

type MixedData = string | number | object | any[] | BigNumber.BigNumber;

declare class Web3 {
    public static providers: typeof providers;
    public currentProvider: Provider;

    public utils: Web3.UtilsApi;
    public eth: Web3.EthApi;
    public personal: Web3.PersonalApi | undefined;
    public version: Web3.VersionApi;
    public net: Web3.NetApi;

    public constructor(provider?: Provider);
}

declare namespace providers {
    class HttpProvider implements Provider {
        constructor(url?: string, timeout?: number, username?: string, password?: string);
        public sendAsync(
            payload: JSONRPCRequestPayload,
            callback: (err: Error, result: JSONRPCResponsePayload) => void,
        ): void;
    }
}

declare namespace Web3 {
    interface ContractInstance {
        address: string;
        abi: ContractAbi;
        [name: string]: any;
    }

    interface Contract<A extends ContractInstance> {
        at(address: string): A;
        getData(...args: any[]): string;
        'new'(...args: any[]): A;
    }

    interface FilterResult {
        get(callback: () => void): void;
        watch(callback: (err: Error, result: LogEntryEvent) => void): void;
        stopWatching(callback?: () => void): void;
    }

    interface Sha3Options {
        encoding: 'hex';
    }

    interface UtilsApi {
        isConnected: () => boolean,
        setProvider: (provider: Provider) => void,
        reset: (keepIsSyncing: boolean) => void,
        toHex: (data: MixedData) => string,
        toAscii: (hex: string) => string,
        fromAscii: (ascii: string, padding?: number) => string,
        toDecimal: (hex: string) => number,
        fromDecimal: (value: number | string) => string,
        fromWei: (value: number | string, unit: Unit) => string,
        // fromWei: (value: BigNumber.BigNumber, unit: Unit) => BigNumber.BigNumber,
        toWei: (amount: number | string, unit: Unit) => string,
        // toWei: (amount: BigNumber.BigNumber, unit: Unit) => BigNumber.BigNumber,
        toBigNumber: (value: number | string) => BigNumber.BigNumber,
        isAddress: (address: string) => boolean,
        isChecksumAddress: (address: string) => boolean,
        sha3: (value: string, options?: Web3.Sha3Options) => string



        BN: () => any,
        _: () => any,

        _fireError: () => any,
        _jsonInterfaceMethodToString: () => any,

        asciiToHex: () => any,
        bytesToHex: () => any,

        checkAddressChecksum: () => any,
        // fromAscii: () => any,

        // fromDecimal: () => any,
        fromUtf8: () => any,

        // fromWei: () => any,
        hexToAscii: () => any,

        hexToBytes: () => any,
        hexToNumber: () => any,

        hexToNumberString: () => any,
        hexToString: () => any,

        hexToUtf8: () => any,
        // isAddress: () => any,

        isBN: () => any,
        isBigNumber: () => any,

        isHex: () => any,
        isHexStrict: () => any,

        keccak256: () => any,
        leftPad: () => any,

        numberToHex: () => any,
        padLeft: () => any,

        padRight: () => any,
        randomHex: () => any,

        rightPad: () => any,
        // sha3: () => any,

        soliditySha3: () => any,
        stringToHex: () => any,

        // toAscii: () => any,
        toBN: () => any,

        toChecksumAddress: () => any,
        // toDecimal: () => any,

        // toHex: () => any,
        toTwosComplement: () => any,

        toUtf8: () => any,
        // toWei: () => any,

        unitMap: () => any,
        utf8ToHex: () => any,
    }

    interface SignedTransaction {
        messageHash: string,
        v: string,
        r: string,
        s: string,
        rawTransaction: string
    }

    interface Account {
        address: string,
        privateKey: string,
        signTransaction(tx: Transaction, privateKey: string, callback?: (error: Error, signedTransaction: SignedTransaction) => void): Promise<SignedTransaction>,
        sign(data: any, privateKey: string): any,
        encrypt(password: string): any[] // kv3 keystore see: http://web3js.readthedocs.io/en/1.0/web3-eth-accounts.html#wallet-encrypt
    }

    interface WalletApi {
        [accountId: number]: Account,
        create(numberOfAccounts: number, entrophy?: string): Account;
        add(privateKeyOrAccount: string | Account): Account,
        remove(account: string | number): boolean,
        clear(): any,
        encrypt(password: string): any[];
        decrypt(keystoreArray: any[], password: string): WalletApi, // wallet object
        save(): any,
        load(): any,
        [accountId: string]: Account | any,
    }

    interface AccountApi {
        signTransaction: (tx: Transaction, privateKey: string, callback?: (error: Error, signedTransaction: SignedTransaction) => void) => Promise<SignedTransaction>,
        create: (entrophy?: string) => any,
        privateKeyToAccount: (key: string) => any,
        /**
         * @param rawTransaction RLP encoded transaction
         * @return Ethereum address used to sign transaction
         */
        recoverTransaction: (rawTransaction: string) => any,
        hashMessage: () => any,
        sign: (data: any, privateKey: string) => any,
        recover: () => any,
        encrypt: () => any,
        decrypt: () => any,
        wallet: WalletApi
    }

    interface EthApi {
        coinbase: string;
        mining: boolean;
        hashrate: number;
        gasPrice: BigNumber.BigNumber;
        accounts: AccountApi;
        blockNumber: number;
        defaultAccount?: string;
        defaultBlock: BlockParam;
        syncing: Web3.SyncingResult;
        compile: {
            solidity(sourceString: string, cb?: (err: Error, result: any) => void): object;
        };
        getMining(cd: (err: Error, mining: boolean) => void): void;
        getHashrate(cd: (err: Error, hashrate: number) => void): void;
        getGasPrice(cd: (err: Error, gasPrice: BigNumber.BigNumber) => void): void;
        getAccounts(cd: (err: Error, accounts: string[]) => void): void;
        getBlockNumber(callback: (err: Error, blockNumber: number) => void): void;
        getSyncing(cd: (err: Error, syncing: Web3.SyncingResult) => void): void;
        isSyncing(cb: (err: Error, isSyncing: boolean, syncingState: Web3.SyncingState) => void): Web3.IsSyncing;

        getBlock(hashStringOrBlockNumber: string | BlockParam): BlockWithoutTransactionData;
        getBlock(
            hashStringOrBlockNumber: string | BlockParam,
            callback: (err: Error, blockObj: BlockWithoutTransactionData) => void,
        ): void;
        getBlock(
            hashStringOrBlockNumber: string | BlockParam,
            returnTransactionObjects: true,
        ): BlockWithTransactionData;
        getBlock(
            hashStringOrBlockNumber: string | BlockParam,
            returnTransactionObjects: true,
            callback: (err: Error, blockObj: BlockWithTransactionData) => void,
        ): void;

        getBlockTransactionCount(hashStringOrBlockNumber: string | BlockParam): number;
        getBlockTransactionCount(
            hashStringOrBlockNumber: string | BlockParam,
            callback: (err: Error, blockTransactionCount: number) => void,
        ): void;

        // TODO returnTransactionObjects
        getUncle(hashStringOrBlockNumber: string | BlockParam, uncleNumber: number): BlockWithoutTransactionData;
        getUncle(
            hashStringOrBlockNumber: string | BlockParam,
            uncleNumber: number,
            callback: (err: Error, uncle: BlockWithoutTransactionData) => void,
        ): void;

        getTransaction(transactionHash: string): Transaction;
        getTransaction(transactionHash: string, callback: (err: Error, transaction: Transaction) => void): void;

        getTransactionFromBlock(hashStringOrBlockNumber: string | BlockParam, indexNumber: number): Transaction;
        getTransactionFromBlock(
            hashStringOrBlockNumber: string | BlockParam,
            indexNumber: number,
            callback: (err: Error, transaction: Transaction) => void,
        ): void;

        contract(abi: AbiDefinition[]): Web3.Contract<any>;

        // TODO block param
        getBalance(addressHexString: string): BigNumber.BigNumber;
        getBalance(addressHexString: string, callback: (err: Error, result: BigNumber.BigNumber) => void): void;

        // TODO block param
        getStorageAt(address: string, position: number): string;
        getStorageAt(address: string, position: number, callback: (err: Error, storage: string) => void): void;

        // TODO block param
        getCode(addressHexString: string): string;
        getCode(addressHexString: string, callback: (err: Error, code: string) => void): void;

        filter(value: string | FilterObject): Web3.FilterResult;

        sendTransaction(txData: TxData): string;
        sendTransaction(txData: TxData, callback: (err: Error, value: string) => void): void;

        sendRawTransaction(rawTxData: string): string;
        sendRawTransaction(rawTxData: string, callback: (err: Error, value: string) => void): void;

        sign(address: string, data: string): string;
        sign(address: string, data: string, callback: (err: Error, signature: string) => void): void;

        getTransactionReceipt(txHash: string): TransactionReceipt | null;
        getTransactionReceipt(
            txHash: string,
            callback: (err: Error, receipt: TransactionReceipt | null) => void,
        ): void;

        // TODO block param
        call(callData: CallData): string;
        call(callData: CallData, callback: (err: Error, result: string) => void): void;

        estimateGas(callData: CallData): number;
        estimateGas(callData: CallData, callback: (err: Error, gas: number) => void): void;

        // TODO defaultBlock
        getTransactionCount(address: string): number;
        getTransactionCount(address: string, callback: (err: Error, count: number) => void): void;
    }

    interface VersionApi {
        api: string;
        network: string;
        node: string;
        ethereum: string;
        whisper: string;
        getNetwork(cd: (err: Error, networkId: string) => void): void;
        getNode(cd: (err: Error, nodeVersion: string) => void): void;
        getEthereum(cd: (err: Error, ethereum: string) => void): void;
        getWhisper(cd: (err: Error, whisper: string) => void): void;
    }

    interface PersonalApi {
        listAccounts: string[] | undefined;
        newAccount(password?: string): string;
        unlockAccount(address: string, password?: string, duration?: number): boolean;
        lockAccount(address: string): boolean;
        sign(message: string, account: string, password: string): string;
        sign(hexMessage: string, account: string, callback: (error: Error, signature: string) => void): void;
    }

    interface NetApi {
        listening: boolean;
        peerCount: number;
        getListening(cd: (err: Error, listening: boolean) => void): void;
        getPeerCount(cd: (err: Error, peerCount: number) => void): void;
    }

    interface SyncingState {
        startingBlock: number;
        currentBlock: number;
        highestBlock: number;
    }
    type SyncingResult = false | SyncingState;

    interface IsSyncing {
        addCallback(cb: (err: Error, isSyncing: boolean, syncingState: SyncingState) => void): void;
        stopWatching(): void;
    }

}
/* tslint:disable */
export = Web3;
    /* tslint:enable */
