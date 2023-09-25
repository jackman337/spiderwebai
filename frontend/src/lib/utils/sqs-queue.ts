import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import type { CrawlBase } from './crawl-types';

const client = new SQSClient({
  region: import.meta.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: import.meta.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const sendCrawlSQS = async ({ supabase, headless, ...params }: CrawlBase) => {
  try {
    await client.send(
      new SendMessageCommand({
        QueueUrl: headless ? import.meta.env.AWS_SQS_URL_CHROME : import.meta.env.AWS_SQS_URL,
        MessageBody: JSON.stringify(params),
        MessageAttributes: {
          Headers: {
            DataType: 'String',
            StringValue: supabase?.realtime?.accessToken || ' ',
          },
        },
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error(`SQS ERROR: ${error}`);
    }
  }
};
