/**
 * Mocks compartilhados. IMPORTANTE: este arquivo precisa ser o PRIMEIRO import
 * de cada teste, para que os jest.mock sejam registrados antes de o controller
 * ser carregado.
 *
 * Nada aqui toca banco, e-mail ou storage reais.
 */

jest.mock("../../src/config/database", () => ({
  __esModule: true,
  default: { transaction: jest.fn() },
}));

jest.mock("../../src/models/usuario.model", () => ({
  UsuarioModel: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../src/models/veiculo.model", () => ({
  VeiculoModel: {
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock("../../src/models/logAcesso.model", () => ({
  LogAcessoModel: { create: jest.fn() },
}));

jest.mock("../../src/config/supabase", () => ({ supabaseAdmin: {} }));
jest.mock("../../src/utils/email", () => ({
  enviarEmailBoasVindas: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../src/utils/lambdaEmail", () => ({
  enviarEmailCnhValidada: jest.fn().mockResolvedValue(undefined),
}));

import sequelize from "../../src/config/database";
import { UsuarioModel } from "../../src/models/usuario.model";
import { VeiculoModel } from "../../src/models/veiculo.model";
import { enviarEmailBoasVindas } from "../../src/utils/email";

export const mUsuario = UsuarioModel as unknown as Record<string, jest.Mock>;
export const mVeiculo = VeiculoModel as unknown as Record<string, jest.Mock>;
export const mSequelize = sequelize as unknown as { transaction: jest.Mock };
export const mEmailBoasVindas = enviarEmailBoasVindas as unknown as jest.Mock;
