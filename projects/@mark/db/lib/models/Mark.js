"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@mark/utils");
const components_1 = require("../components");
const Model_1 = require("./Model");
const User_1 = require("./User");
const IpfsPost_1 = require("./IpfsPost");
const EthereumPost_1 = require("./EthereumPost");
const ipfs_1 = require("../components/ipfs");
const components_2 = require("../components");
const debug = require('debug')('mark:Mark');
const util = require("util");
const COLLECTION_NAME = 'marks';
const TIME_CONST = 1527699872;
class Mark extends Model_1.default {
    constructor() {
        super(COLLECTION_NAME);
        this.users = new User_1.User();
    }
    static calculatePopularity(likes, totalVotes, time) {
        const z = 1.96;
        if (totalVotes === 0)
            return 0;
        const phat = 1.0 * likes / totalVotes;
        return (phat + z * z / (Math.pow(2, totalVotes)) - z *
            Math.pow(((phat * (1 - phat) + z * z / (4 * totalVotes)) / totalVotes), 0.5)) /
            (1 + z * z / totalVotes);
    }
    static timeWeightedPopularity(popularity, time, newer) {
        if (newer)
            return Math.log10(popularity) + (time - TIME_CONST) / 4500;
        else
            return Math.log10(popularity) + 4500 / (time - TIME_CONST);
    }
    static map(mark) {
        const mapped = {
            id: mark._id.toString(),
            ethereum_id: mark.ethereum_id,
            body: mark.body,
            owner: mark.owner,
            createdAt: mark.createdAt.toDateString(),
        };
        return mapped;
    }
    listFeed(handle, opts) {
        const DEFAULT_LIMIT = 100;
        const postOwners = [];
        const filter = { owner: { $in: postOwners } };
        const options = {};
        const sort = {};
        const { nextDirection, nextField, nextId } = opts;
        let { limit } = opts;
        limit = limit | DEFAULT_LIMIT;
        let consumableMarks = [];
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
            return this.query(filter, options, sort, limit, nextField, nextId, nextDirection);
        })
            .then(marksMeta => {
            debug('markMeta', marksMeta);
            const { nextId } = marksMeta;
            consumableMarks = marksMeta.items;
            if (consumableMarks.length === 0) {
                return Promise.resolve({
                    items: [],
                    next: undefined
                });
            }
            const hashes = marksMeta.items.map(m => m.ipfs_id);
            return components_1.ipfs.getManyIpfsPosts(hashes)
                .then(ipfsPosts => {
                debug('ipfsPosts');
                ipfsPosts.forEach((post, index) => {
                    consumableMarks[index].body = post.content;
                });
                return Promise.resolve({
                    items: consumableMarks,
                    nextId
                });
            });
        })
            .catch(error => debug(error));
    }
    getByOwner(handle) {
        const filter = { owner: handle };
        return this.findMany(filter);
    }
    create(content, user, passwordh) {
        debug('new content being created');
        debug('content', content);
        debug('user', user);
        debug('passwordh', passwordh);
        const { handle, refPK, _id, address } = user;
        const post = new IpfsPost_1.IpfsPost(handle, new Date(), content);
        const userId = User_1.User.mapId(_id);
        const mark = {
            owner: handle,
            ethereum_id: undefined,
            ipfs_id: undefined
        };
        return utils_1.authentication.getLinkPK(userId, handle, passwordh)
            .then(linkPK => {
            debug('linkPK', linkPK);
            const privateKey = utils_1.authentication.getPrivateKey(linkPK, refPK);
            debug('privateKey', privateKey);
            return ipfs_1.addIpfsPost(post)
                .then(ipfsHash => {
                debug('ipfsHash', ipfsHash);
                mark.ipfs_id = ipfsHash;
                const ethPost = new EthereumPost_1.EthereumPost(ipfsHash);
                return components_2.ethereum.addEthereumPost(ethPost, address, privateKey);
            });
        })
            .then(txHash => {
            debug('txHash', txHash);
            mark.ethereum_id = txHash;
            return this.insertOne(mark);
        });
    }
    updateOne(query, update) {
        return this.collection.updateOne(query, update);
    }
}
exports.Mark = Mark;