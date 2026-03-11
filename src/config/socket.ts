import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:4200",
        "https://faculride.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Autenticação pelo mesmo JWT do backend
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth as any)?.token ||
      (socket.handshake.query as any)?.token;

    if (!token) {
      return next(new Error("No token"));
    }

    try {
      const decoded: any = jwt.verify(
        String(token),
        process.env.JWT_SECRET || "secretoo123"
      );

      // mesmo shape usado no AuthorizeMiddleware
      (socket as any).user = {
        id: decoded.id ?? decoded.idUsuario,
        idUsuario: decoded.id ?? decoded.idUsuario,
        nome: decoded.nome,
        tipoUsuario: decoded.tipoUsuario,
      };

      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    if (!user?.idUsuario) return;

    // Sala exclusiva do usuário
    socket.join(`user:${user.idUsuario}`);

    // Sala de viagem (para chat/notificações futuras)
    socket.on("joinTrip", (tripId: number) => {
      socket.join(`trip:${tripId}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io não inicializado");
  }
  return io;
};
