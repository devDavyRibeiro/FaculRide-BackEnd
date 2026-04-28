import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const AuthorizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ✅ Libera imediatamente preflight requests (OPTIONS)
    if (req.method === "OPTIONS") {
      return res.sendStatus(204); // Sem conteúdo, apenas confirma que a rota existe
    }

    const headerAuth =
      (req.headers["authorization"] as string) ||
      (req.headers["x-access-token"] as string);

    if (!headerAuth) {
      return res.status(401).json({ erro: "Token não fornecido." });
    }

    // Suporta "Bearer xxx" ou apenas "xxx"
    const token = headerAuth.startsWith("Bearer ")
      ? headerAuth.slice(7).trim()
      : headerAuth.trim();

    const secret = process.env.JWT_SECRET || "secretoo123";

    jwt.verify(token, secret, (err, decoded: any) => {
      if (err || !decoded) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
      }

      // Compatibilidade: grava nos dois campos
      (req as any).usuario = decoded;
      (req as any).user = {
        id: decoded.id ?? decoded.idUsuario,
        idUsuario: decoded.id ?? decoded.idUsuario,
        nome: decoded.nome,
        tipoUsuario: decoded.tipoUsuario,
      };

      return next();
    });
  } catch (e) {
    return res.status(401).json({ erro: "Falha na autenticação." });
  }
};
