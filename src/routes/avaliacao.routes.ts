import express, { Request, Response } from "express";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";
import { listAll, create, update, remove } from "../controllers/avaliacao.controller";

const router = express.Router();

// Autenticação
router.use(AuthorizeMiddleware as any);

// GET /api/avaliacao
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const avaliacoes = await listAll();
    res.status(200).json(avaliacoes);
  } catch (error: any) {
    res.status(500).json({ erro: error.message || "Erro ao buscar avaliações" });
  }
});

// POST /api/avaliacao
router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const nova = await create(req.body);
    res.status(201).json({
      mensagem: "Avaliação criada com sucesso",
      avaliacao: nova,
    });
  } catch (error: any) {
    res.status(400).json({ erro: error.message || "Erro ao criar avaliação" });
  }
});

// PUT /api/avaliacao/:id
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const atualizada = await update(id, req.body);

    if (!atualizada) {
      res.status(404).json({ erro: "Avaliação não encontrada." });
      return;
    }

    res.status(200).json({
      mensagem: "Avaliação atualizada com sucesso.",
      avaliacao: atualizada,
    });
  } catch (error: any) {
    res.status(400).json({ erro: error.message || "Erro ao atualizar avaliação" });
  }
});

// DELETE /api/avaliacao/:id
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const ok = await remove(id);

    if (!ok) {
      res.status(404).json({ erro: "Avaliação não encontrada." });
      return;
    }

    res.status(200).json({ mensagem: "Avaliação deletada com sucesso." });
  } catch (error: any) {
    res.status(500).json({ erro: error.message || "Erro ao deletar avaliação" });
  }
});

export default router;
