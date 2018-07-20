"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const components_1 = require("../components");
const Model_1 = require("./Model");
const utils_1 = require("@mark/utils");
const debug = require('debug')('mark:Account');
const util = require("util");
const COLLECTION_NAME = 'users';
class User extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
        this.indexes = [
            {
                key: {
                    handle: 1,
                },
                name: 'handle_index_v0',
                unique: true
            },
        ];
        this.users = this.collection;
        this.following = new components_1.mongoDb.Collection('following');
    }
    static map(user) {
        const mappedUser = {
            handle: user.handle,
            address: user.address,
            balance: user.balance,
        };
        return mappedUser;
    }
    create(userId, handle, refU, linkPK, state) {
        const web3 = components_1.W3.getInstance();
        const ethWallet = web3.eth.accounts.create();
        debug('ethWallet', ethWallet);
        const refPK = utils_1.authentication.getRefPK(linkPK, ethWallet.privateKey);
        const user = {
            _id: User.formatId(userId),
            handle,
            refPK,
            address: ethWallet.address,
            linkI: undefined,
            refU,
            state,
            followers: [],
            following: [],
            profilePicture: undefined,
            balance: '0'
        };
        debug('user', user);
        return this.insertOne(user);
    }
    checkIfExists(handle) {
        const handleHash = handle;
        const filter = { handleh: handle };
        return this.exists(filter);
    }
    updateById(id, modifications) {
        const filter = { _id: User.formatId(id) };
        const update = { $set: Object.assign({}, modifications) };
        const options = { returnNewDocument: true };
        return this.users.findOneAndUpdate(filter, update, options)
            .then((result) => {
            debug(`Updating by ${util.inspect(filter, true, null)}. Response: ${util.inspect(result, true, null)}`);
            return Promise.resolve(result.value);
        });
    }
    existsByHandle(handle) {
        const filter = { handle };
        return this.exists(filter);
    }
    getByHandle(handle) {
        const filter = { handle };
        return this.users.findOne(filter);
    }
    getManyByHandle(handles) {
        const filter = { handle: { $in: handles } };
        return this.findMany(filter);
    }
    updateByHandle(handle, modifications) {
        const filter = { handle };
        return this.users.updateOne(filter, { $set: Object.assign({}, modifications) })
            .then(updateWriteOpResult => Promise.resolve());
    }
    _getFollowers(handle) {
        return this.getByHandle(handle)
            .then(account => Promise.resolve(account.followers));
    }
    getFollowers(handle) {
        const query = { following: handle };
        return this.following.findMany(query);
    }
    getFollowing(handle) {
        const query = { owner: handle };
        debug('query', query);
        debug('this.following', this.following);
        return this.following.findMany(query);
    }
    addFollower(followerHandle, targetHandle) {
        const followingRecord = {
            owner: followerHandle,
            following: targetHandle,
            hash: Buffer.from(`${followerHandle}:${targetHandle}`).toString('base64')
        };
        return this.following.insertOne(followingRecord);
    }
    removeFollower(followerHandle, targetHandle) {
        const followingRecord = {
            owner: followerHandle,
            following: targetHandle,
            hash: Buffer.from(`${followerHandle}:${targetHandle}`).toString('base64')
        };
        return this.following.deleteOne(followingRecord);
    }
    updateProfilePicture(handle, url) {
        const modifications = { profilePicture: url };
        return this.updateByHandle(handle, modifications);
    }
    fundUserAccount(handle) {
        return this.getByHandle(handle)
            .then(userRecord => components_1.ethereum.fundAccount(userRecord.address))
            .then(res => {
            const eth = components_1.W3.getInstance().utils.fromWei(res.tx.v, 'ether');
            return this.updateByHandle(handle, { balance: eth });
        })
            .then(updateResult => Promise.resolve(undefined));
    }
    getBlance(handle) {
        return this.getByHandle(handle)
            .then(userRecord => components_1.ethereum.getBalance(userRecord.address));
    }
    getGasPrice() {
        debug('getgas');
        return components_1.ethereum.getGasPrice();
    }
}
exports.User = User;