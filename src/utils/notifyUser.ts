import { NotificationModel } from "../models/notification.model";
import { getIO } from "../config/socket";

interface NotifyParams {
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

export const notifyUser = async (params: NotifyParams) => {
  const notification = await NotificationModel.create({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    metadata: params.metadata ?? null,
  });

  // Emite em tempo real (se o socket estiver ok)
  try {
    const io = getIO();
    io.to(`user:${params.userId}`).emit("notification:new", notification.toJSON());
  } catch (e) {
    console.error("[notifyUser] erro ao emitir notificação em tempo real:", e);
  }

  return notification;
};
