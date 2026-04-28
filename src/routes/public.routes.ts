import { Router } from "express";
import { publicStats } from "../controllers/public.controller";

const router = Router();
router.get("/stats", publicStats); // GET /api/public/stats
export default router;

