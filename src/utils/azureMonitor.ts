import * as appInsights from 'applicationinsights';

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
    .setAutoCollectRequests(true)
    .setAutoCollectPerformance(true, true)
    .setAutoCollectExceptions(true)
    .setAutoCollectDependencies(true)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .start();
}

const client = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING 
  ? appInsights.defaultClient 
  : null;

export async function sendLog(message: any) {
  try {
    if (client) {
      client.trackTrace({ 
        message: JSON.stringify(message),
        properties: message 
      });
    } else {
      console.log("AZURE MONITOR [Local Fallback]:", JSON.stringify(message));
    }
  } catch (error) {
    console.error('Erro ao enviar log para o Azure Monitor:', error);
  }
}