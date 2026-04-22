import {
  GetObjectCommand,
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

export const main = async (bucketName: string, key: string) => {
  const client = new S3Client({});

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      }),
    );
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const str = await response.Body.transformToString();
    console.log(str);
  } catch (caught) {
    if (caught instanceof NoSuchKey) {
      console.error(
        `Error from S3 while getting object "${key}" from "${bucketName}". No such key exists.`,
      );
    } else if (caught instanceof S3ServiceException) {
      console.error(
        `Error from S3 while getting object from ${bucketName}.  ${caught.name}: ${caught.message}`,
      );
    } else {
      throw caught;
    }
  }
};