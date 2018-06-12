// import { resolve } from 'dns';

const AWS = require('aws-sdk');

const {
  AWS_ID_KEY: accessKeyId,
  AWS_SECRET_KEY: secretAccessKey,
  AWS_REGION: region
} = process.env;

AWS.config = new AWS.Config({
  accessKeyId,
  secretAccessKey,
  region
});

const sns = new AWS.SNS({ apiVersion: '2010-03-31' });

export type SNSResponse = {
  ResponseMetadata: { RequestId: string },
  MessageId: string;
};

export function sendCode(phoneNumber: string | number, code: string): Promise<SNSResponse> {
  return new Promise((resolve, reject) => {

    const params = {
      Message: `${code} is your Mark authentication code`,
      PhoneNumber: phoneNumber,
      Subject: 'Mark: Confirm Your Identity',
    };

    sns.publish(params, (error: Error, data: SNSResponse) => {
      if (error) reject(error); // , error.stack); // an error occurred
      else resolve(data);           // successful response
    });
  });
}
