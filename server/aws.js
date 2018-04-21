/**
 * ./server/aws.js
 */

import aws from 'aws-sdk';

export default function sendEmail(options) {
  aws.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.Amazon_accessKeyId,
    secretAccessKey: process.env.Amazon_secretAccessKey,
  });

  // AWS SES offers multiple options for ses.sendEmail().
  // For example, ToAddresses, CcAddresses, BccAddresses,
  // ReplyToAddresses, Source, Subject, Body and more.
  const ses = new aws.SES({ apiVersion: 'latest' });

  return new Promise((resolve, reject) => {
    // We will use:
    ses.sendEmail(
      {
        // Source (let's call it options.from),
        Source: options.from,
        Destination: {
          // ToAddresses (options.to, nested in the Destination array),
          ToAddresses: options.to,
          // CcAddresses (options.cc, nested in the Destination array),
          CcAddresses: options.cc,
        },
        Message: {
          Subject: {
            // Data (options.subject, nested in the Message>Subject array),
            Data: options.subject,
          },
          Body: {
            Html: {
              // another Data (options.body, nested in the Message>Body>Html array),
              Data: options.body,
            },
          },
        },
        // and ReplyToAddresses (options.replyTo).
        ReplyToAddresses: options.replyTo,
      },
      (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      },
    );
  });
}
