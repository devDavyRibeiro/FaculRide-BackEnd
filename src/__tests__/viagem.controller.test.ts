/// <reference types="jest" />
// Mocka os models ANTES de importar o controller, para não precisar de um
// banco Postgres real rodando para testar a regra de negócio.
jest.mock("../models/viagem.model", () => ({
  ViagemModel: { findAll: jest.fn() },
}));
jest.mock("../models/usuario.model", () => ({ UsuarioModel: {} }));
jest.mock("../models/viajem_agendada.model", () => ({ ViajemAgendadaModel: {} }));
jest.mock("../models/conversa_carona.model", () => ({ ConversaCaronaModel: {} }));

import { listAll } from "../controllers/viagem.controller";
import { ViagemModel } from "../models/viagem.model";

function fakeViagem(overrides: Record<string, any>) {
  return {
    toJSON: () => ({
      idViagem: 1,
      horarioSaida: "08:00",
      agendamentos: [],
      conversas: [],
      cancelada: false,
      ...overrides,
    }),
  };
}

describe("viagem.controller -> listAll (usado pela tela 'Encontre uma carona')", () => {
  afterEach(() => jest.clearAllMocks());

  it("retorna as viagens de motoristas E de passageiros (não filtra nada no backend)", async () => {
    (ViagemModel.findAll as jest.Mock).mockResolvedValue([
      fakeViagem({ idViagem: 1, usuario: { tipoUsuario: "motorista" } }),
      fakeViagem({ idViagem: 2, usuario: { tipoUsuario: "passageiro" } }),
    ]);

    const resultado = await listAll();

    expect(resultado).toHaveLength(2);
    expect(resultado.map((v: any) => v.usuario.tipoUsuario).sort()).toEqual([
      "motorista",
      "passageiro",
    ]);
  });

  it("cada viagem inclui o campo 'usuario' com tipoUsuario — necessário para o app filtrar por tipo", async () => {
    (ViagemModel.findAll as jest.Mock).mockResolvedValue([
      fakeViagem({ idViagem: 5, usuario: { nome: "Ana", tipoUsuario: "motorista" } }),
    ]);

    await listAll();

    // Confere a query que o controller monta, e não o retorno do mock: é o
    // `attributes` do include que decide se o Sequelize traz tipoUsuario.
    const args = (ViagemModel.findAll as jest.Mock).mock.calls[0][0];
    const incUsuario = args.include.find((i: any) => i.as === "usuario");

    expect(incUsuario).toBeDefined();
    expect(incUsuario.attributes).toContain("tipoUsuario");
  });

  it("calcula e devolve 'statusViagem' para cada viagem retornada", async () => {
    (ViagemModel.findAll as jest.Mock).mockResolvedValue([fakeViagem({ idViagem: 7 })]);

    const [viagem] = (await listAll()) as any[];

    expect(viagem).toHaveProperty("statusViagem");
  });

  it("retorna lista vazia quando não há viagens cadastradas", async () => {
    (ViagemModel.findAll as jest.Mock).mockResolvedValue([]);

    const resultado = await listAll();

    expect(resultado).toEqual([]);
  });
});
