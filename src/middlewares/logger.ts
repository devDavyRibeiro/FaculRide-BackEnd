import { Request, Response, NextFunction } from 'express';
import { sendLog } from '../utils/cloudwatch';

export async function logger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', async () => {
    const tempo = Date.now() - start;

    console.log("LOG DISPARADO");

    await sendLog({
      tipo: 'REQUEST',
      metodo: req.method,
      rota: req.originalUrl,
      status: res.statusCode,
      tempo: `${tempo}ms`,
      data: new Date()
    });
  });

  next();
}