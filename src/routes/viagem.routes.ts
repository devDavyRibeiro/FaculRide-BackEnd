import express, { Request, Response } from "express";
import { listAll, create, update, remove } from "../controllers/viagem.controller";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";

const router = express.Router();

// Aplica autenticação JWT para todas as rotas abaixo
router.use(AuthorizeMiddleware as any);

// GET viagem
router.get("/", (req: Request, res: Response) => {
  listAll()
    .then(viagens => res.status(200).json(viagens))
    .catch(error =>
      res.status(500).json({ erro: error.message || "Erro ao buscar viagens" })
    );
});

// POST viagem
router.post("/", (req: Request, res: Response) => {
  create(req.body)
    .then(novaViagem =>
      res.status(201).json({
        mensagem: "Viagem cadastrada com sucesso",
        viagem: novaViagem
      })
    )
    .catch(error =>
      res.status(500).json({ erro: error.message || "Erro ao cadastrar viagem" })
    );
});

// PUT viagem
router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  update(Number(id), req.body)
    .then(viagemAtualizada => {
      if (!viagemAtualizada) {
        return res.status(404).json({ erro: "Viagem não encontrada" });
      }
      res.status(200).json({
        mensagem: "Viagem atualizada com sucesso",
        viagem: viagemAtualizada
      });
    })
    .catch(error =>
      res.status(500).json({ erro: error.message || "Erro ao atualizar viagem" })
    );
});

// DELETE viagem
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;

  remove(Number(id))
    .then(sucesso => {
      if (!sucesso) {
        return res.status(404).json({ erro: "Viagem não encontrada" });
      }
      res.status(200).json({ mensagem: "Viagem deletada com sucesso" });
    })
    .catch(error =>
      res.status(500).json({ erro: error.message || "Erro ao deletar viagem" })
    );
});

export default router;
