import express, { NextFunction, Request, Response } from "express";
import {
  cadastrarUsuario,
  filtrarUsuarios,
  loginUsuario,
  buscarUsuarioPorId,
  atualizarUsuario,
  deletarUsuario,
  cadastrarFotoUsuario,
  cadastrarFotoCnhUsuario,
  validarCnhUsuario,
  deletarFotoUsuario,
  alterarSenha
} from "../controllers/usuario.controller";
import { Iusuario, IusuarioFiltros } from "../interfaces/Iusuario";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";

import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

const autorizarProprioUsuario = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const usuarioAutenticado = (req as any).user;
  const idAutenticado = Number(usuarioAutenticado?.id ?? usuarioAutenticado?.idUsuario);
  const idSolicitado = Number(req.params.id);

  if (
    !Number.isSafeInteger(idAutenticado) ||
    idAutenticado < 1 ||
    !Number.isSafeInteger(idSolicitado) ||
    idSolicitado < 1 ||
    idAutenticado !== idSolicitado
  ) {
    res.status(403).json({
      erro: "Você só pode alterar ou excluir seus próprios dados.",
    });
    return;
  }

  next();
};

// ROTAS PÚBLICAS — Cadastro e Login
router.post("/", async (req, res) => {
  const usuario = req.body as Iusuario;

  try {
    const resposta = await cadastrarUsuario(usuario);
    res.status(201).json(resposta);
  } catch (error: any) {
    res.status(400).json({ erro: error.message || "Erro ao cadastrar usuário " + error });
  }
});

router.post("/login", (req, res) => {
  loginUsuario(req, res);
});

// A partir daqui todas as rotas são protegidas
router.use(AuthorizeMiddleware as any);

// GET Listar ou filtrar usuários
router.get("/", async (req, res) => {
  const filtros = req.query as unknown as IusuarioFiltros;
  try {
    const resposta = await filtrarUsuarios(filtros);
    res.status(200).json(resposta);
  } catch (error: any) {
    res.status(500).json({ erro: error.message });
  }
});

// GET Buscar usuário por ID
router.get("/:id", (req, res) => {
  buscarUsuarioPorId(req, res);
});

// ROTA PROTEGIDA — alterar senha do usuário autenticado
router.put("/alterar-senha", (req, res) => {
  alterarSenha(req, res);
});

// PUT Atualizar dados do usuário
router.put("/:id", autorizarProprioUsuario, (req, res) => {
  atualizarUsuario(req, res);
});

// DELETE usuário
router.delete("/:id", autorizarProprioUsuario, (req, res) => {
  deletarUsuario(req, res);
});

// ROTA PROTEGIDA — atualiza SOMENTE fotoUrl/fotoPath do usuário autenticado (JSON)
router.patch("/foto", (req, res) => {
  cadastrarFotoUsuario(req, res);
});

// NOVA ROTA PROTEGIDA — upload multipart da foto + atualização automática no usuário
router.post("/foto/upload", upload.single("file"), (req, res) => {
  cadastrarFotoUsuario(req, res);
});

router.post("/cnh/upload", upload.single("file"), (req, res) => {
  cadastrarFotoCnhUsuario(req, res);
});

router.patch("/cnh/validar/:id", (req, res) => {
  validarCnhUsuario(req, res);
});

router.delete("/foto/delete", (req, res) => {
  deletarFotoUsuario(req, res);
});

router.put("/foto/update", upload.single("file"), (req, res) => {
  cadastrarFotoUsuario(req, res);
})
export default router;