import express from "express";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";

import {
  iniciarConversa,
  listarMinhasConversas,
  listarMensagens,
  enviarMensagem,
  aceitarCarona,
  recusarCarona,
} from "../controllers/conversa.controller";

const router = express.Router();

// 🔐 Todas protegidas
router.use(AuthorizeMiddleware as any);

// ================= CONVERSA =================

// POST iniciar conversa
router.post("/iniciar", (req, res) => {
  iniciarConversa(req, res);
});

// GET minhas conversas
router.get("/", (req, res) => {
  listarMinhasConversas(req, res);
});

// ================= MENSAGENS =================

// GET mensagens da conversa
router.get("/:idConversa/mensagens", (req, res) => {
  listarMensagens(req, res);
});

// POST enviar mensagem
router.post("/mensagem", (req, res) => {
  enviarMensagem(req, res);
});

// ================= AÇÕES =================

// PATCH aceitar carona
router.patch("/:idConversa/aceitar", (req, res) => {
  aceitarCarona(req, res);
});

// PATCH recusar carona
router.patch("/:idConversa/recusar", (req, res) => {
  recusarCarona(req, res);
});

export default router;