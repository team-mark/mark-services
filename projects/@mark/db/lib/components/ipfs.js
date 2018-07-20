"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const IpfsPost_1 = require("../models/IpfsPost");
const ipfsAPI = require('ipfs-api');
const debug = require('debug')('mark:ipfs');
const { IPFS_ENDPOINT, IPFS_PORT } = process.env;
const ipfsClient = new ipfsAPI(IPFS_ENDPOINT, IPFS_PORT);
function addIpfsPost(post) {
    debug('addIpfsPost');
    debug('post', post);
    const bufString = Buffer.from(JSON.stringify(post));
    return ipfsClient.files.add(bufString)
        .then((result) => {
        debug('ipfs result', result);
        return Promise.resolve(result[0].hash);
    });
}
exports.addIpfsPost = addIpfsPost;
function getIpfsPost(hash) {
    debug('getIpfsPost');
    debug('hash', hash);
    return ipfsClient.files.cat(hash)
        .then((file) => {
        const json = JSON.parse(file.toString('utf8'));
        debug('ipfs file (json)', json);
        const post = new IpfsPost_1.IpfsPost(json.author, json.time, json.content);
        return Promise.resolve(post);
    });
}
exports.getIpfsPost = getIpfsPost;
function getManyIpfsPosts(hashes) {
    const promises = [];
    hashes.forEach((value, index) => promises.push(getIpfsPost(value)));
    return Promise.all(promises);
}
exports.getManyIpfsPosts = getManyIpfsPosts;
function pinPost(hash) {
    return ipfsClient.pin.add(hash)
        .then((str) => {
        return Promise.resolve(str.length > 0);
    });
}
exports.pinPost = pinPost;
function getPinnedPosts() {
    return ipfsClient.pin.ls()
        .then((pins) => {
        return Promise.resolve(pins);
    });
}
exports.getPinnedPosts = getPinnedPosts;