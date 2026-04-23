import {
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

import { Upload } from "@aws-sdk/lib-storage";
import e from "express";

export async function uploadArquivoS3(file: Express.Multer.File) {
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

export async function getArquivoS3() {
  const params = {
    Bucket: process.env.BUCKET_NAME!,
    // Prefix: "pasta/", // Opcional: filtrar por pasta/prefixo
  };

  try {
    // Enviar o comando
    const data = await s3.send(new ListObjectsV2Command(params));
    
    // Processar e exibir os resultados
    console.log("Objetos encontrados:");
    data.Contents?.forEach((object) => {
      console.log(` - ${object.Key} (${object.Size} bytes)`);
    });
    return data.Contents;
  } catch (err) {
    console.error("Erro ao listar objetos:", err);
  }
}