import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function loadSecrets() {
  try {
    const secretName = process.env.AWS_SECRET_NAME;

    // Ambiente local sem Secrets Manager
    if (!secretName) {
      console.log("ℹ️ AWS_SECRET_NAME não definido. Usando variáveis do .env local.");
      return;
    }

    const client = new SecretsManagerClient({
      region: process.env.AWS_REGION,
    });

    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);

    if (!response.SecretString) {
      throw new Error("SecretString vazia");
    }

    const secrets = JSON.parse(response.SecretString);

    Object.entries(secrets).forEach(([key, value]) => {
      process.env[key] = String(value);
    });

    console.log("✅ Secrets carregados do AWS Secrets Manager");

  } catch (error) {
    console.error("❌ Erro ao carregar secrets:", error);
    throw error;
  }
}