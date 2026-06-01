import {
  LambdaClient,
  InvokeCommand,
} from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
});

export const enviarEmailCnhValidada = async (
  email: string,
  nome: string
) => {

  const payload = {
    email,
    nome,
  };

  const command = new InvokeCommand({
    FunctionName: "faculride-email-cnh-validada",
    InvocationType: "Event",
    Payload: Buffer.from(JSON.stringify(payload)),
  });

  await lambda.send(command);
};