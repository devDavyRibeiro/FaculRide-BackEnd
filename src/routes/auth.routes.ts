import { Router } from "express";
import { esqueciSenhaUsuario, loginUsuario } from "../controllers/usuario.controller";

const router = Router();

router.post("/login", (req, res) => {
  loginUsuario(req, res);
});

router.post("/esqueci-senha", esqueciSenhaUsuario);

export default router;