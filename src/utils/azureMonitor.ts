
import * as appInsights from 'applicationinsights';

let initialized = false;

function getClient() {
  if (!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    return null;
  }

  if (!initialized) {
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true, true)
      .setUseDiskRetryCaching(true)
      .start();

    initialized = true;
  }

  return appInsights.defaultClient ?? null;
}

export async function sendLog(message: any) {
  try {
    const client = getClient();

    if (client) {
      client.trackTrace({
        message: JSON.stringify(message),
        properties: message,
      });
    } else {
      console.log(
        'AZURE MONITOR [Local Fallback]:',
        JSON.stringify(message)
      );
    }
  } catch (error) {
    console.error('Erro ao enviar log para o Azure Monitor:', error);
  }
}
