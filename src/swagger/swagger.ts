import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { swaggerDocument } from "./schemas";

// Configurações do Swagger
const options = {
  definition: swaggerDocument,
  apis: [], 
};

const swaggerSpec = swaggerJSDoc(options);

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("🔗 Swagger disponível em: http://localhost:3000/api-docs");
};

