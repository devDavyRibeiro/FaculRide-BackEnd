import { Request, Router, Response } from "express";
import dotenv from "dotenv";
// Importação do S3 removida temporariamente para corrigir o build

dotenv.config();

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  // Chamada ao S3 removida; mantemos apenas a resposta de sucesso
  res.json({ message: 'Teste de rota funcionando!' });
});

export default router;