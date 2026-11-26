/**
 * Cadastro, edição, cancelamento e exclusão de viagem (viagem.controller.ts).
 * Os models são simulados: nenhum teste acessa o banco.
 */
jest.mock("../src/models/viagem.model", () => ({
  ViagemModel: { findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
}));
jest.mock("../src/models/usuario.model", () => ({ UsuarioModel: {} }));
jest.mock("../src/models/viajem_agendada.model", () => ({ ViajemAgendadaModel: { bulkCreate: jest.fn() } }));
jest.mock("../src/models/conversa_carona.model", () => ({ ConversaCaronaModel: { update: jest.fn() } }));

import { create, update, cancelarViagem, remove } from "../src/controllers/viagem.controller";
import { ViagemModel } from "../src/models/viagem.model";
import { ViajemAgendadaModel } from "../src/models/viajem_agendada.model";
import { ConversaCaronaModel } from "../src/models/conversa_carona.model";

const mViagem = ViagemModel as unknown as Record<string, jest.Mock>;
const mAgendada = ViajemAgendadaModel as unknown as Record<string, jest.Mock>;
const mConversa = ConversaCaronaModel as unknown as Record<string, jest.Mock>;

function resposta() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const dadosViagem = {
  tipoUsuario: "motorista",
  partida: "Votorantim",
  destino: "Fatec Votorantim",
  horarioEntrada: "19:00",
  horarioSaida: "22:30",
  ajudaDeCusto: "5",
  idUsuario: 1,
} as any;

describe("create (POST /api/viagem)", () => {
  it("cadastra a viagem e as datas agendadas", async () => {
    mViagem.create.mockResolvedValue({ getDataValue: () => 10 });

    await create({ ...dadosViagem, datasAgendadas: ["2026-12-01", "2026-12-02"] });

    expect(mViagem.create).toHaveBeenCalledWith(dadosViagem);
    expect(mAgendada.bulkCreate).toHaveBeenCalledWith([
      { idViagem: 10, data: "2026-12-01" },
      { idViagem: 10, data: "2026-12-02" },
    ]);
  });

  it("sem datas agendadas, não cria agendamentos", async () => {
    mViagem.create.mockResolvedValue({ getDataValue: () => 11 });
    await create(dadosViagem);
    expect(mAgendada.bulkCreate).not.toHaveBeenCalled();
  });

  it("falha se o banco não gerar o id da viagem", async () => {
    mViagem.create.mockResolvedValue({ getDataValue: () => undefined });
    await expect(create(dadosViagem)).rejects.toThrow("ID da viagem não foi gerado após o cadastro.");
  });
});

describe("update (PUT /api/viagem/:id)", () => {
  it("atualiza a viagem existente", async () => {
    const viagem = { update: jest.fn().mockResolvedValue({ idViagem: 1, destino: "Fatec Sorocaba" }) };
    mViagem.findByPk.mockResolvedValue(viagem);

    const resultado = await update(1, { destino: "Fatec Sorocaba" } as any);

    expect(viagem.update).toHaveBeenCalledWith({ destino: "Fatec Sorocaba" });
    expect(resultado).toEqual({ idViagem: 1, destino: "Fatec Sorocaba" });
  });

  it("retorna null quando a viagem não existe", async () => {
    mViagem.findByPk.mockResolvedValue(null);
    expect(await update(999, {} as any)).toBeNull();
  });
});

describe("cancelarViagem (PATCH /api/viagem/:id/cancelar)", () => {
  const req = (idUsuario: number) => ({ params: { id: "5" }, user: { id: idUsuario } });

  it("404 quando a viagem não existe", async () => {
    mViagem.findByPk.mockResolvedValue(null);
    const res = resposta();
    await cancelarViagem(req(1), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: "Viagem não encontrada" });
  });

  it("400 quando a viagem já está cancelada", async () => {
    mViagem.findByPk.mockResolvedValue({ cancelada: true, idUsuario: 1 });
    const res = resposta();
    await cancelarViagem(req(1), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("403 quando quem cancela não é o dono da viagem", async () => {
    mViagem.findByPk.mockResolvedValue({ cancelada: false, idUsuario: 1 });
    const res = resposta();
    await cancelarViagem(req(2), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ erro: "Somente o motorista pode cancelar esta viagem" });
  });

  it("200: o dono cancela e as conversas da viagem também ficam canceladas", async () => {
    const viagem = { idViagem: 5, cancelada: false, idUsuario: 1, update: jest.fn() };
    mViagem.findByPk.mockResolvedValue(viagem);
    const res = resposta();

    await cancelarViagem(req(1), res);

    expect(viagem.update).toHaveBeenCalledWith(expect.objectContaining({ cancelada: true, canceladaPor: 1 }));
    expect(mConversa.update).toHaveBeenCalledWith(
      { status: "cancelada", aceiteMotorista: false, aceitePassageiro: false },
      { where: { idViagem: 5 } }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("500 quando o banco falha", async () => {
    mViagem.findByPk.mockRejectedValue(new Error("banco fora do ar"));
    const res = resposta();
    await cancelarViagem(req(1), res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "banco fora do ar" });
  });
});

describe("remove (DELETE /api/viagem/:id)", () => {
  it("exclui a viagem existente", async () => {
    const viagem = { destroy: jest.fn().mockResolvedValue(undefined) };
    mViagem.findByPk.mockResolvedValue(viagem);
    expect(await remove(1)).toBe(true);
    expect(viagem.destroy).toHaveBeenCalled();
  });

  it("retorna false quando a viagem não existe", async () => {
    mViagem.findByPk.mockResolvedValue(null);
    expect(await remove(999)).toBe(false);
  });
});
