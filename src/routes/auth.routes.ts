import { Router } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UsuarioModel } from "../models/usuario.model";

dotenv.config();

const router = Router();

router.post("/login", async (req: any, res: any) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "E-mail e senha são obrigatórios" });
  }

  try {
    const usuario = await UsuarioModel.findOne({
      where: { email, senha },
    });

    if (!usuario) {
      return res.status(401).json({ message: "E-mail ou senha inválidos" });
    }

    const token = jwt.sign(
      {
        id: usuario.idUsuario,
        nome: usuario.nome,
        tipoUsuario: usuario.tipoUsuario,
      },
      process.env.JWT_SECRET || "",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: usuario.idUsuario,
        nome: usuario.nome,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Erro ao realizar login",
    });
  }
});

export default router;
