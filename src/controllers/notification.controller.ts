import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";

export const listMyNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = (req as any).user || (req as any).usuario;
  const userId = user?.idUsuario || user?.id;

  if (!userId) {
    res.status(401).json({ erro: "Não autenticado" });
    return;
  }

  const notifications = await NotificationModel.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });

  res.json(notifications);
};

export const markAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = (req as any).user || (req as any).usuario;
  const userId = user?.idUsuario || user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ erro: "Não autenticado" });
    return;
  }

  const notification = await NotificationModel.findOne({
    where: { id, userId },
  });

  if (!notification) {
    res.status(404).json({ erro: "Notificação não encontrada" });
    return;
  }

  await notification.update({ isRead: true });

  res.json({ ok: true });
};

export const markAllAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const user = (req as any).user || (req as any).usuario;
  const userId = user?.idUsuario || user?.id;

  if (!userId) {
    res.status(401).json({ erro: "Não autenticado" });
    return;
  }

  await NotificationModel.update(
    { isRead: true },
    { where: { userId, isRead: false } }
  );

  res.json({ ok: true });
};
