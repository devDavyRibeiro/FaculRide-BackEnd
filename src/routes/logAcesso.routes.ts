import express, { Request, Response } from "express";
import { create, listAll, remove, update } from "../controllers/logAcesso.controller";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";

const router = express.Router();

// Aplica autenticação JWT para todas as rotas abaixo
router.use(AuthorizeMiddleware as any);

// GET log de acessos
router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await listAll();
    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({ erro: error.message || "Erro ao buscar log de acesso" });
  }
});

// POST log de acesso
router.post('/', async (req: Request, res: Response) => {
  try {
    const novoLog = await create(req.body);
    res.status(201).json({
      mensagem: "Log de acesso criado com sucesso",
      logAcesso: novoLog
    });
  } catch (error: any) {
    res.status(500).json({ erro: error.message || "Erro ao cadastrar log de acesso" });
  }
});

// PUT log de acesso
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  update(Number(id), req.body)
    .then(logAtualizado => {
      if (!logAtualizado) {
        return res.status(404).json({ erro: "Log de acesso não encontrado" });
      }
      res.status(200).json({
        mensagem: "Log de acesso atualizado com sucesso",
        logAcesso: logAtualizado
      });
    })
    .catch(error => {
      res.status(500).json({ erro: error.message || "Erro ao atualizar log de acesso" });
    });
});

// DELETE log de acesso
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  remove(Number(id))
    .then(sucesso => {
      if (!sucesso) {
        return res.status(404).json({ erro: "Log de acesso não encontrado" });
      }
      res.status(200).json({ mensagem: "Log de acesso deletado com sucesso" });
    })
    .catch(error => {
      res.status(500).json({ erro: error.message || "Erro ao deletar log de acesso" });
    });
});

export default router;
