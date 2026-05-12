import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import fs from "fs";

export async function getEc2Dns(): Promise<string | undefined> {
    if (!process.env.AWS_REGION) {
      console.error("❌ AWS_REGION não definido no .env");
      process.exit(1);
    }
    const ec2 = new EC2Client({ 
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.aws_access_key_id!,
            secretAccessKey: process.env.aws_secret_access_key!,
            sessionToken: process.env.aws_session_token!,
        }
     });
    const command = new DescribeInstancesCommand({
    Filters: [
      { Name: "instance-state-name", Values: ["running"] },
      { Name: "tag:Name", Values: ["mongo-db-ec2"] }
    ]
  });

  const response = await ec2.send(command);

  const instance = response.Reservations?.[0]?.Instances?.[0];

  if (!instance?.PublicDnsName) {
    console.error("❌ Nenhuma EC2 ativa encontrada ou sem DNS público.");
    return undefined;
  }
  return instance.PublicDnsName;
}

