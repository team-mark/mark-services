"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require("aws-sdk");
const debugV = require('debug')('mark-sys:s3');
const { AWS_ID_KEY: accessKeyId, AWS_SECRET_KEY: secretAccessKey, AWS_REGION: region } = process.env;
AWS.config = new AWS.Config({
    accessKeyId,
    secretAccessKey,
    region,
    apiVersions: {
        s3: '2006-03-01',
    }
});
const s3 = new AWS.S3();
function uploadFile(file) {
    const { filename, } = file;
    const albumPhotosKey = 'uploads';
    const photoKey = `${albumPhotosKey}//${filename}`;
    const params = {
        Key: photoKey,
        Body: file,
        ACL: 'public-read',
        Bucket: 'mark-resources-public'
    };
    const options = {};
    return new Promise((resolve, reject) => {
        s3.upload(params, options, (error, data) => {
            if (error) {
                return reject(error);
            }
            else {
                debugV('uploaded image, data:');
                debugV(data);
                resolve(data.Location);
            }
        });
    });
}
exports.uploadFile = uploadFile;