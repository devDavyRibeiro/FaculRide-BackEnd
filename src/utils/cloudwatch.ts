import AWS from 'aws-sdk';

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN
});

const cloudwatch = new AWS.CloudWatchLogs();

const logGroupName = 'api-logs';
const logStreamName = 'api-stream';

export async function sendLog(message: any) {
  const params = {
    logEvents: [
      {
        message: JSON.stringify(message),
        timestamp: Date.now()
      }
    ],
    logGroupName,
    logStreamName
  };

  try {
    await cloudwatch.putLogEvents(params).promise();
  } catch (error) {
    console.error('Erro ao enviar log:', error);
  }
}