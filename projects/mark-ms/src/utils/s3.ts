import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
const debugV = require('debug')('mark-sys:s3');

const {
    AWS_ID_KEY: accessKeyId,
    AWS_SECRET_KEY: secretAccessKey,
    AWS_REGION: region
} = process.env;

(AWS.config as any) = new AWS.Config({
    accessKeyId,
    secretAccessKey,
    region,
    apiVersions: {
        s3: '2006-03-01',
    }
});

const s3 = new AWS.S3();

export type MulterFile = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
};

export function uploadFile(file: MulterFile): Promise<string> {
    debugV('uploadfile', AWS.config);

    try {
        const { filename } = file;
        // const albumPhotosKey = 'uploads/uploads/';

        const filePath = path.resolve(__dirname, path.resolve('uploads', file.filename));
        debugV('filePath', filePath);

        const binary = fs.readFileSync(filePath);

        const photoKey = `user/uploads/${filename}`;

        const params = {
            Key: photoKey,
            Body: binary,
            ACL: 'public-read',
            Bucket: 'mark-resources-public'
        };
        const options = {};

        console.log('posting to bucket');
        debugV(params);
        return new Promise((resolve, reject) => {
            s3.upload(params, options, (error: Error, data: AWS.S3.ManagedUpload.SendData) => {

                // remove photo from local storage always
                fs.unlinkSync(filePath);

                if (error) {
                    debugV(error);
                    return reject(error);

                } else {
                    debugV('uploaded image, data:');
                    debugV(data);
                    resolve(data.Location);
                }
            });
        });
    } catch (e) {
        debugV(e);
        return Promise.reject(e);
    }
}
