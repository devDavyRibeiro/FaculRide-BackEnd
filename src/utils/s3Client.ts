import {
  _Object,
  CompleteMultipartUploadCommandOutput,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.aws_access_key_id!,
    secretAccessKey: process.env.aws_secret_access_key!,
    sessionToken: process.env.aws_session_token!,
  },
});

import { Upload } from "@aws-sdk/lib-storage";
import e from "express";

export async function uploadArquivoS3(file: Express.Multer.File): Promise<CompleteMultipartUploadCommandOutput |  undefined> {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: process.env.BUCKET_NAME!,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
      
    },

    queueSize: 4, // uploads paralelos
    partSize: 5 * 1024 * 1024, // 5MB por parte
  });

  upload.on("httpUploadProgress", (progress) => {
    console.log("Progresso:", progress);
  });

  const result = await upload.done();
  console.log("Upload concluído:", result);
  return result;
}

// export async function getArquivoS3(key: string) {
//   const result = await s3.getObject({
//     Bucket: process.env.BUCKET_NAME!,
//     Key: key,
//   });
//   return result;
// }

export async function getArquivoS3byID(etag: string):Promise<_Object | undefined> {
  // Garante que a ETag buscada tenha aspas, como o S3 retorna
  const formattedEtag = etag.startsWith('"') ? etag : `"${etag}"`;
  
  let isTruncated:boolean = true;
  let continuationToken: string | undefined = undefined;
  let foundObject: _Object | undefined = undefined;

  console.log(`Iniciando busca pela ETag: ${formattedEtag}...`);

  try {
    while (isTruncated) {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: process.env.BUCKET_NAME!,
        ContinuationToken: continuationToken,
        // MaxKeys: 1000 // Padrão é 1000, ideal para buscas grandes
      });

      const response = await s3.send(command);

      // Procura na página atual
      foundObject = response.Contents?.find(obj => obj.ETag === formattedEtag);

      if (foundObject) {
        console.log("✅ Objeto encontrado!");
        console.log(`Key: ${foundObject.Key}`);
        console.log(`Tamanho: ${foundObject.Size} bytes`);
        break; // Interrompe o loop se achar
      }

      // Prepara para a próxima página
      isTruncated = response.IsTruncated ?? false;
      continuationToken = response?.NextContinuationToken;

      if (isTruncated) {
        console.log("Buscando na próxima página de objetos...");
      }
    }

    if (!foundObject) {
      return undefined; // Retorna undefined se não encontrar o objeto
    }

    return foundObject;

  } catch (error) {
    console.error("Erro ao listar objetos:", error);
    throw error;
  }
}