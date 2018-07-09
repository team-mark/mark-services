import { Multihash, IPFSFile } from 'ipfs';
import { IpfsPost } from '../models/IpfsPost';
// const ipfsAPI = require('ipfs-api');
const ipfsAPI = require('ipfs-api');
const debug = require('debug')('mark:ipfs');

const ip = '10.171.204.180';
const port = 80;
const ipfsClient = new ipfsAPI(ip, port);

// Adds an IpfsPost and returns its hash.
export function addIpfsPost(post: IpfsPost): Promise<Multihash> {
    debug('addIpfsPost');
    debug('post', post);

    const bufString = Buffer.from(JSON.stringify(post));

    return ipfsClient.files.add(bufString)
        .then((result: IPFSFile[]) => {
            debug('ipfs result', result);
            return Promise.resolve(result[0].hash);
        });
}

// Returns the post with the given ipfs hash.
export function getIpfsPost(hash: string): Promise<IpfsPost> {
    debug('getIpfsPost');
    debug('hash', hash);

    return ipfsClient.files.cat(hash)
    .then((file: Buffer) => {

        const json = JSON.parse(file.toString('utf8'));
        debug('ipfs file (json)', json);
        const post: IpfsPost = new IpfsPost(json.author, json.time, json.content);

        return Promise.resolve(post);
    });
}

export function getManyIpfsPosts(hashes: string[]): Promise<IpfsPost[]> {
    const promises: Promise<IpfsPost>[] = [];

    hashes.forEach((value, index) =>
        promises.push(getIpfsPost(value))
    );

    return Promise.all(promises);
}

// Returns whether or not the hash was successfully pinned.
export function pinPost(hash: Multihash): Promise<boolean> {

    return ipfsClient.pin.add(hash)
        .then((str: string[]) => {
            return Promise.resolve(str.length > 0);
        });
}

export function getPinnedPosts(): Promise<any> {

    return ipfsClient.pin.ls()
        .then((pins: any) => {
            return Promise.resolve(pins);
        });
}
