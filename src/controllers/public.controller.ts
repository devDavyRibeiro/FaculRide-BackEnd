// src/controllers/public.controller.ts
import { Request, Response } from "express";
import { fn, col } from "sequelize";
import { UsuarioModel } from "../models/usuario.model";
import { AvaliacaoModel } from "../models/avaliacao.model";

export const publicStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1) Totais por tipo (ENUM: 'motorista' | 'passageiro')
    const [motoristas, passageiros] = await Promise.all([
      UsuarioModel.count({ where: { tipoUsuario: "motorista" } }),
      UsuarioModel.count({ where: { tipoUsuario: "passageiro" } }),
    ]);

    // 2) Média de avaliações (0..5) direto no banco
    const result = await AvaliacaoModel.findAll({
      attributes: [[fn("COALESCE", fn("AVG", col("Estrelas")), 0), "media"]],
      raw: true,
    });
    const mediaAvaliacoes = Number((result?.[0] as any)?.media ?? 0);

    res.json({
      totais: { motoristas, passageiros },
      satisfacaoMedia: Math.round(mediaAvaliacoes * 10) / 10, // 1 casa
    });
  } catch (e) {
    console.error("[/api/public/stats] erro:", e);
    res.status(500).json({ erro: "Erro ao calcular estatísticas públicas" });
  }
};
