import { Router } from "express";
import { loginUsuario } from "../controllers/usuario.controller";

const router = Router();

router.post("/login", (req, res) => {
  loginUsuario(req, res);
});

export default router;