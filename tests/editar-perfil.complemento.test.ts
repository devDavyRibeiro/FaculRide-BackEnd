/**
 * Complemento do cartão "Testar Editar perfil":
 *  - "Editar somente quando os dados obrigatórios forem preenchidos"  -> usa a validação REAL do model Sequelize
 *  - "Exclusão de veículo"                                            -> rotas /api/veiculo
 *
 * Diferente dos outros arquivos, aqui o UsuarioModel NÃO é mockado: só a conexão com o banco
 * (o Sequelize é criado, mas nunca conecta) e os serviços externos.
 */
jest.mock("../src/config/database", () => {
  const { Sequelize } = require("sequelize");
  return {
    __esModule: true,
    default: new Sequelize("postgres://u:p@localhost:5432/teste", { logging: false, dialectModule: require("pg") }),
  };
});
jest.mock("../src/models/veiculo.model", () => ({
  VeiculoModel: { findByPk: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), destroy: jest.fn() },
}));
jest.mock("../src/models/logAcesso.model", () => ({ LogAcessoModel: { create: jest.fn() } }));
jest.mock("../src/config/supabase", () => ({ supabaseAdmin: {} }));
jest.mock("../src/utils/email", () => ({ enviarEmailBoasVindas: jest.fn() }));
jest.mock("../src/utils/lambdaEmail", () => ({ enviarEmailCnhValidada: jest.fn() }));

import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { UsuarioModel } from "../src/models/usuario.model";
import { VeiculoModel } from "../src/models/veiculo.model";
import usuarioRoutes from "../src/routes/usuario.routes";
import veiculoRoutes from "../src/routes/veiculo.routes";
import { bug } from "./helpers/bug";

const app = express();
app.use(express.json());
app.use("/api/usuario", usuarioRoutes);
app.use("/api/veiculo", veiculoRoutes);

const auth = (id: number) => ({
  Authorization: `Bearer ${jwt.sign({ id, nome: `U${id}`, tipoUsuario: "passageiro" }, process.env.JWT_SECRET!)}`,
});

const mVeiculo = VeiculoModel as unknown as Record<string, jest.Mock>;

/** Usuário REAL do Sequelize; só o acesso ao banco é trocado (update = set + validate, sem SQL). */
function usuarioReal(over: Record<string, unknown> = {}) {
  const u = UsuarioModel.build({
    idUsuario: 1, nome: "Aluno Teste", cpf: "12345678909", ra: "1234567890123",
    dataNascimento: "2000-01-15", genero: true, cep: "18110000", endereco: "Rua A", numero: "10",
    cidade: "Votorantim", estado: "SP", email: "aluno@fatec.sp.gov.br", telefone: "15999990000",
    senha: "hash", tipoUsuario: "passageiro", fatec: "Fatec Votorantim", ...over,
  } as any);
  (u as any).update = async (dados: any) => {
    u.set(dados);
    await u.validate(); // é o que o Sequelize faz antes do UPDATE
    return u;
  };
  return u;
}

beforeEach(() => {
  jest.spyOn(UsuarioModel, "findByPk").mockResolvedValue(usuarioReal() as any);
});
afterEach(() => jest.restoreAllMocks());

const editar = (body: object, id = 1) => request(app).put(`/api/usuario/${id}`).set(auth(1)).send(body);

describe("Editar somente quando os dados obrigatórios forem preenchidos (validação real do model)", () => {
  it("dados válidos => 200", async () => {
    const res = await editar({ nome: "Nome Novo", telefone: "15988887777", cidade: "Sorocaba" });
    expect(res.status).toBe(200);
  });

  it.each([
    ["nome", null], ["cep", null], ["endereco", null], ["cidade", null], ["telefone", null], ["fatec", null],
    ["e-mail malformado", "abc"],
  ])("não persiste %s inválido/nulo (resposta de erro)", async (campo, valor) => {
    const body = campo === "e-mail malformado" ? { email: valor } : { [campo]: valor };
    const res = await editar(body);
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("CPF com tamanho errado não é aceito", async () => {
    const res = await editar({ cpf: "123" });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // Achado: dado inválido vira 500 (erro do Sequelize vazando), deveria ser 400 com mensagem clara.
  bug("dado obrigatório nulo retorna 400 (hoje 500)", async () => {
    const res = await editar({ nome: null });
    expect(res.status).toBe(400);
  });

  bug("e-mail malformado retorna 400 (hoje 500)", async () => {
    const res = await editar({ email: "abc" });
    expect(res.status).toBe(400);
  });

  // Achado: string vazia passa em todas as validações do model e é gravada.
  bug("campo obrigatório vazio ('') é recusado (hoje é aceito com 200)", async () => {
    for (const campo of ["nome", "cep", "endereco", "cidade", "telefone", "fatec"]) {
      const res = await editar({ [campo]: "" });
      expect(res.status).toBe(400);
    }
  });
});

describe("Exclusão de veículo (DELETE /api/veiculo/:id)", () => {
  const veiculo = (idUsuario: number) => ({ idVeiculo: 5, idUsuario, destroy: jest.fn().mockResolvedValue(undefined) });

  it("exige autenticação (401 sem token)", async () => {
    const res = await request(app).delete("/api/veiculo/5");
    expect(res.status).toBe(401);
  });

  it("200 'Veículo deletado com sucesso' e remove o registro", async () => {
    const v = veiculo(1);
    mVeiculo.findByPk.mockResolvedValue(v);
    const res = await request(app).delete("/api/veiculo/5").set(auth(1));
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe("Veículo deletado com sucesso");
    expect(v.destroy).toHaveBeenCalledTimes(1);
  });

  it("id inexistente => 404 'Veículo não encontrado para este ID'", async () => {
    mVeiculo.findByPk.mockResolvedValue(null);
    const res = await request(app).delete("/api/veiculo/999").set(auth(1));
    expect(res.status).toBe(404);
    expect(res.body.erro).toBe("Veículo não encontrado para este ID");
  });

  it("erro de banco => 500 com a mensagem", async () => {
    const v = veiculo(1);
    v.destroy.mockRejectedValue(new Error("fk violation"));
    mVeiculo.findByPk.mockResolvedValue(v);
    const res = await request(app).delete("/api/veiculo/5").set(auth(1));
    expect(res.status).toBe(500);
    expect(res.body.erro).toBe("fk violation");
  });

  // Achado: o handler não confere se o veículo pertence ao usuário do token.
  bug("usuário 1 não pode deletar o veículo do usuário 2 (403)", async () => {
    const v = veiculo(2);
    mVeiculo.findByPk.mockResolvedValue(v);
    const res = await request(app).delete("/api/veiculo/5").set(auth(1));
    expect(res.status).toBe(403);
    expect(v.destroy).not.toHaveBeenCalled();
  });
});

describe("Edição de veículo (PUT /api/veiculo/:id)", () => {
  it("200 e atualiza os dados", async () => {
    const v = { idVeiculo: 5, idUsuario: 1, update: jest.fn().mockResolvedValue(undefined) };
    mVeiculo.findByPk.mockResolvedValue(v);
    const res = await request(app)
      .put("/api/veiculo/5").set(auth(1))
      .send({ Placa_veiculo: "XYZ9K88", Cor: "Branco", Modelo: "Onix", Ano: 2020, idUsuario: 1 });
    expect(res.status).toBe(200);
    expect(v.update).toHaveBeenCalledWith(expect.objectContaining({ Placa_veiculo: "XYZ9K88", Ano: 2020 }));
  });

  it("id inexistente => 404", async () => {
    mVeiculo.findByPk.mockResolvedValue(null);
    const res = await request(app).put("/api/veiculo/999").set(auth(1)).send({});
    expect(res.status).toBe(404);
  });

  // Achado: o corpo define idUsuario, então dá para "doar" o veículo para outro usuário.
  bug("PUT não permite trocar o dono (idUsuario) do veículo", async () => {
    const v = { idVeiculo: 5, idUsuario: 1, update: jest.fn().mockResolvedValue(undefined) };
    mVeiculo.findByPk.mockResolvedValue(v);
    await request(app).put("/api/veiculo/5").set(auth(1)).send({ Placa_veiculo: "AAA1A11", idUsuario: 99 });
    expect(v.update).not.toHaveBeenCalledWith(expect.objectContaining({ idUsuario: 99 }));
  });
});
