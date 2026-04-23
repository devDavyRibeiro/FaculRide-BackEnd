import { Request, Router,Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UsuarioModel } from "../models/usuario.model";
import { getArquivoS3 } from "../utils/s3Client";


dotenv.config();

const router = Router();

router.get('/', async (req:Request, res:Response) => {
  const response = await getArquivoS3();
  res.json({ message: 'Teste de rota funcionando!', response });
});
export default router;
  