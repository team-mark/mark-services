"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = require('aws-sdk');
const { AWS_ID_KEY: accessKeyId, AWS_SECRET_KEY: secretAccessKey, AWS_REGION: region } = process.env;
AWS.config = new AWS.Config({
    accessKeyId,
    secretAccessKey,
    region
});
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
function sendCode(phoneNumber, code) {
    return new Promise((resolve, reject) => {
        const params = {
            Message: `${code} is your Mark authentication code`,
            PhoneNumber: phoneNumber,
            Subject: 'Mark: Confirm Your Identity',
        };
        sns.publish(params, (error, data) => {
            if (error)
                reject(error);
            else
                resolve(data);
        });
    });
}
exports.sendCode = sendCode;