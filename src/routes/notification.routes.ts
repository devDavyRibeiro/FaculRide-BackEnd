import { Router } from "express";
import { AuthorizeMiddleware } from "../middlewares/authorize.middleware";
import {
  listMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller";

const router = Router();

router.use(AuthorizeMiddleware as any);

router.get("/", listMyNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

export default router;


