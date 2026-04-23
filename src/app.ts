import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";

// Importação do Swagger
import { setupSwagger } from "./swagger/swagger";

// Importação das rotas
import authRoutes from "./routes/auth.routes";
import usuarioRoutes from "./routes/usuario.routes";
import veiculoRoutes from "./routes/veiculo.routes";
import avaliacaoRoutes from "./routes/avaliacao.routes";
import viagemRoutes from "./routes/viagem.routes";
import logAcessoRoutes from "./routes/logAcesso.routes";
import publicRoutes from "./routes/public.routes";
import notificationRoutes from "./routes/notification.routes";
import teste from "./routes/teste.routes";
import pagamentoRoutes from "./routes/pagamento.routes";
// Socket.IO
import { initSocket } from "./config/socket";

// Importa models e associações
import "./models/usuario.model";
import "./models/viagem.model";
import "./models/avaliacao.model";
import "./models/logAcesso.model";
import "./models/veiculo.model";
import "./models/associations";

const app = express();

/** -------- CORS explícito -------- */
const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return true; // curl, health checks etc.

  try {
    const url = new URL(origin);

    // localhost (qualquer porta)
    if (url.hostname === "localhost") return true;

    // qualquer subdomínio *.vercel.app
    if (url.hostname.endsWith(".vercel.app")) return true;

    // domínio fixo, se tiver
    if (origin === "https://faculride.vercel.app") return true;

    return false;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, cb) => {
      if (isAllowedOrigin(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// responde preflight
app.options("*", cors());
/** -------------------------------- */

app.use(express.json());

// Swagger
setupSwagger(app);

// Rotas públicas
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

// Rotas protegidas
app.use("/api/usuario", usuarioRoutes);
app.use("/api/veiculo", veiculoRoutes);
app.use("/api/avaliacao", avaliacaoRoutes);
app.use("/api/viagem", viagemRoutes);
app.use("/api/logacesso", logAcessoRoutes);

// Rota de pagamento (apoiadores)
app.use("/api", pagamentoRoutes);

// Rotas de notificações (JWT é aplicado dentro do router)
app.use("/api/notifications", notificationRoutes);
app.use("/api/teste", teste);

/** --------- Servidor HTTP + Socket.IO --------- */
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// inicializa o Socket.IO usando o mesmo servidor
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
/** --------------------------------------------- */

export default app;
