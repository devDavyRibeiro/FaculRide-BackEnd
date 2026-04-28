import express from "express";
import {
  listarTodos,
  listarPorUsuario,
  criarVeiculo,
  atualizarVeiculo,
  deletarVeiculo
} from "../controllers/veiculo.controller";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";

const router = express.Router();

// Aplica autenticação JWT para todas as rotas abaixo
router.use(AuthorizeMiddleware as any);

// GET veiculos
router.get("/", async (req, res) => {
  await listarTodos(req, res);
});

// GET listar veículo por usuário
router.get("/usuario/:idUsuario", async (req, res) => {
  await listarPorUsuario(req, res);
});

// POST veiculo
router.post("/", async (req, res) => {
  await criarVeiculo(req, res);
});

// PUT veículo
router.put("/:id", async (req, res) => {
  await atualizarVeiculo(req, res);
});

// DELETE veículo
router.delete("/:id", async (req, res) => {
  await deletarVeiculo(req, res);
});

export default router;
