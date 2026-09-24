import { BlobServiceClient } from "@azure/storage-blob";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const containerName = process.env.AZURE_CONTAINER_NAME || "uploads";

if (!connectionString) {
  console.error("❌ AZURE_STORAGE_CONNECTION_STRING não definida no .env");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

export const uploadFileToAzure = async (fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  
  // Garante que o container existe e permite acesso público aos blobs
  await containerClient.createIfNotExists({ access: "blob" });

  // Cria um nome único para o ficheiro para evitar conflitos
  const uniqueName = `${Date.now()}-${fileName.replace(/\s+/g, "_")}`;
  const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);

  // Faz o upload do buffer para o Azure Blob Storage
  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  return blockBlobClient.url;
};