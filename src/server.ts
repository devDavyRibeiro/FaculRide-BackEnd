import dotenv from "dotenv";
dotenv.config();

import { loadSecrets } from "./config/loadSecrets";

async function start() {
  try {
    await loadSecrets();

    console.log("🚀 Iniciando aplicação...");

    require("./app");

  } catch (error) {
    console.error("❌ Erro ao iniciar aplicação:", error);
    process.exit(1);
  }
}

start();