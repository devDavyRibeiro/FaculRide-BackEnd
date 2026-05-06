import { Request, Router,Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UsuarioModel } from "../models/usuario.model";
import { getArquivoS3byID } from "../utils/s3Client";


dotenv.config();

const router = Router();

router.get('/', async (req:Request, res:Response) => {
  const response = await getArquivoS3byID('487a96b01acae527c51aaa9f1112c9f1');
  res.json({ message: 'Teste de rota funcionando!', response });
});
export default router;
  