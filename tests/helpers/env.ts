process.env.JWT_SECRET = "jest-secret";
process.env.NODE_ENV = "test";
// O blobStorageService cria o cliente da Azure ao ser importado; nos testes o
// storage é mockado, mas a connection string precisa ter um formato válido.
process.env.AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=dGVzdGU=;EndpointSuffix=core.windows.net";
