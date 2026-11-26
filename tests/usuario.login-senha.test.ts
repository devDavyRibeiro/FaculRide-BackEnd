/**
 * Login, busca de usuário, validação de CNH, recuperação de senha e veículos.
 * Os controllers são chamados direto, com req/res simulados e models mockados.
 */
jest.mock("../src/config/database", () => ({ __esModule: true, default: { transaction: jest.fn() } }));
jest.mock("../src/models/usuario.model", () => ({
  UsuarioModel: { findOne: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), update: jest.fn() },
}));
jest.mock("../src/models/veiculo.model", () => ({
  VeiculoModel: { findOne: jest.fn(), findAll: jest.fn(), create: jest.fn() },
}));
jest.mock("../src/models/logAcesso.model", () => ({ LogAcessoModel: { create: jest.fn() } }));
jest.mock("../src/utils/email", () => ({
  enviarEmailBoasVindas: jest.fn(),
  enviarEmailRecuperacaoSenha: jest.fn(),
}));
jest.mock("../src/utils/AzureEmail", () => ({ enviarEmailCnhValidada: jest.fn() }));
jest.mock("../src/services/blobStorageService", () => ({ uploadFileToAzure: jest.fn() }));

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  loginUsuario,
  filtrarUsuarios,
  buscarUsuarioPorId,
  validarCnhUsuario,
  esqueciSenhaUsuario,
  redefirSenha,
} from "../src/controllers/usuario.controller";
import { listarTodos, listarPorUsuario, criarVeiculo } from "../src/controllers/veiculo.controller";
import { UsuarioModel } from "../src/models/usuario.model";
import { VeiculoModel } from "../src/models/veiculo.model";
import { LogAcessoModel } from "../src/models/logAcesso.model";
import { enviarEmailRecuperacaoSenha } from "../src/utils/email";
import { enviarEmailCnhValidada } from "../src/utils/AzureEmail";
import { bug } from "./helpers/bug";

const mUsuario = UsuarioModel as unknown as Record<string, jest.Mock>;
const mVeiculo = VeiculoModel as unknown as Record<string, jest.Mock>;
const mLog = LogAcessoModel as unknown as Record<string, jest.Mock>;
const mEmailRecuperacao = enviarEmailRecuperacaoSenha as unknown as jest.Mock;
const mEmailCnh = enviarEmailCnhValidada as unknown as jest.Mock;

const SECRET = process.env.JWT_SECRET!;

function resposta() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

/** Usuário como o Sequelize devolve: getDataValue, dataValues e propriedades diretas. */
function usuarioDoBanco(over: Record<string, unknown> = {}) {
  const dados: Record<string, unknown> = {
    idUsuario: 7,
    nome: "Marcos Motorista",
    email: "marcos@fatec.sp.gov.br",
    tipoUsuario: "motorista",
    senha: bcrypt.hashSync("Senha@123", 4),
    cpf: "12345678909",
    cnh: "12345678900",
    fotoUrl: "https://teste.blob.core.windows.net/faculride/foto.png",
    cnhFotoUrl: null,
    ...over,
  };
  return { ...dados, dataValues: dados, getDataValue: (k: string) => dados[k] };
}

describe("Login (POST /api/usuario/login)", () => {
  const login = async (body: Record<string, unknown>) => {
    const res = resposta();
    await loginUsuario({ body } as any, res);
    return res;
  };

  it.each([
    ["e-mail em branco", { email: "", senha: "Senha@123" }],
    ["senha em branco", { email: "marcos@fatec.sp.gov.br", senha: "" }],
  ])("400 com %s", async (_nome, body) => {
    const res = await login(body);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "E-mail e senha são obrigatórios" });
  });

  it("401 com e-mail que não existe no banco", async () => {
    mUsuario.findOne.mockResolvedValue(null);
    const res = await login({ email: "nao@existe.com", senha: "Senha@123" });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "E-mail ou senha inválidos" });
  });

  it("401 com senha incorreta para e-mail válido (mesma mensagem genérica)", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco());
    const res = await login({ email: "marcos@fatec.sp.gov.br", senha: "Errada@123" });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "E-mail ou senha inválidos" });
  });

  it("normaliza o e-mail (espaços e maiúsculas) antes de buscar", async () => {
    mUsuario.findOne.mockResolvedValue(null);
    await login({ email: "  Marcos@Fatec.SP.gov.br  ", senha: "Senha@123" });
    expect(mUsuario.findOne).toHaveBeenCalledWith({ where: { email: "marcos@fatec.sp.gov.br" } });
  });

  it("200: devolve token JWT com id, nome e tipoUsuario, válido por 1 dia", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco());
    mVeiculo.findOne.mockResolvedValue(null);

    const res = await login({ email: "marcos@fatec.sp.gov.br", senha: "Senha@123" });

    expect(res.status).toHaveBeenCalledWith(200);
    const { token } = res.json.mock.calls[0][0];
    const payload: any = jwt.verify(token, SECRET);
    expect(payload).toMatchObject({ id: 7, nome: "Marcos Motorista", tipoUsuario: "motorista" });
    expect(payload.exp - payload.iat).toBe(24 * 60 * 60);
  });

  it("grava uma linha em logAcesso a cada login", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco());
    mVeiculo.findOne.mockResolvedValue(null);
    await login({ email: "marcos@fatec.sp.gov.br", senha: "Senha@123" });
    expect(mLog.create).toHaveBeenCalledWith(expect.objectContaining({ idUsuario: 7, tipoUsuario: "motorista" }));
  });

  it("motorista recebe os dados do veículo e as URLs de foto/CNH no payload", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco());
    mVeiculo.findOne.mockResolvedValue({ toJSON: () => ({ Placa_veiculo: "ABC1D23", Modelo: "Gol" }) });

    const res = await login({ email: "marcos@fatec.sp.gov.br", senha: "Senha@123" });

    const { usuario } = res.json.mock.calls[0][0];
    expect(usuario.veiculo).toEqual({ Placa_veiculo: "ABC1D23", Modelo: "Gol" });
    expect(usuario.fotoUrl).toBe("https://teste.blob.core.windows.net/faculride/foto.png");
    expect(usuario.cnhFotoUrl).toBeNull();
    expect(usuario).not.toHaveProperty("senha");
  });

  it("500 quando o cadastro no banco está sem id", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco({ idUsuario: null }));
    const res = await login({ email: "marcos@fatec.sp.gov.br", senha: "Senha@123" });
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("500 quando o cadastro no banco está sem senha", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco({ senha: null }));
    const res = await login({ email: "marcos@fatec.sp.gov.br", senha: "Senha@123" });
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("500 quando o banco falha", async () => {
    mUsuario.findOne.mockRejectedValue(new Error("banco fora do ar"));
    const res = await login({ email: "marcos@fatec.sp.gov.br", senha: "Senha@123" });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ erro: "banco fora do ar" });
  });
});

describe("Filtro e busca de usuário", () => {
  it("filtrarUsuarios monta o where só com os filtros informados", async () => {
    mUsuario.findAll.mockResolvedValue([]);
    await filtrarUsuarios({ tipoUsuario: "motorista" } as any);
    expect(mUsuario.findAll).toHaveBeenCalledWith({ where: { tipoUsuario: "motorista" } });
  });

  it("buscarUsuarioPorId: 404 quando não existe", async () => {
    mUsuario.findByPk.mockResolvedValue(null);
    const res = resposta();
    await buscarUsuarioPorId({ params: { id: "99" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("buscarUsuarioPorId: 200 com o veículo e sem a senha", async () => {
    mUsuario.findByPk.mockResolvedValue(usuarioDoBanco());
    mVeiculo.findOne.mockResolvedValue({ toJSON: () => ({ Modelo: "Gol" }) });
    const res = resposta();

    await buscarUsuarioPorId({ params: { id: "7" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const corpo = res.json.mock.calls[0][0];
    expect(corpo).toMatchObject({ id: 7, tipoUsuario: "motorista", veiculo: { Modelo: "Gol" } });
    expect(corpo).not.toHaveProperty("senha");
  });

  it("buscarUsuarioPorId: 500 quando o banco falha", async () => {
    mUsuario.findByPk.mockRejectedValue(new Error("falhou"));
    const res = resposta();
    await buscarUsuarioPorId({ params: { id: "7" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("Validação de CNH (PATCH /api/usuario/cnh/validar/:id)", () => {
  const validar = async (id: string) => {
    const res = resposta();
    await validarCnhUsuario({ params: { id } } as any, res);
    return res;
  };

  it("400 com id inválido", async () => {
    expect((await validar("abc")).status).toHaveBeenCalledWith(400);
  });

  it("404 quando o usuário não existe", async () => {
    mUsuario.findByPk.mockResolvedValue(null);
    expect((await validar("9")).status).toHaveBeenCalledWith(404);
  });

  it("403 para passageiro", async () => {
    mUsuario.findByPk.mockResolvedValue(usuarioDoBanco({ tipoUsuario: "passageiro" }));
    const res = await validar("7");
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mEmailCnh).not.toHaveBeenCalled();
  });

  it("200 para motorista e envia o e-mail de CNH validada", async () => {
    mUsuario.findByPk.mockResolvedValue(usuarioDoBanco());
    const res = await validar("7");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(mEmailCnh).toHaveBeenCalledWith("marcos@fatec.sp.gov.br", "Marcos Motorista");
  });

  it("500 quando o envio do e-mail falha", async () => {
    mUsuario.findByPk.mockResolvedValue(usuarioDoBanco());
    mEmailCnh.mockRejectedValueOnce(new Error("Azure indisponível"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect((await validar("7")).status).toHaveBeenCalledWith(500);
  });
});

describe("Recuperação de senha", () => {
  it("esqueci a senha: 404 para e-mail não cadastrado", async () => {
    mUsuario.findOne.mockResolvedValue(null);
    const res = resposta();
    await esqueciSenhaUsuario({ body: { email: "nao@existe.com" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mEmailRecuperacao).not.toHaveBeenCalled();
  });

  it("esqueci a senha: 204 e envia e-mail com token que expira em 30 minutos", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco());
    const res = resposta();

    await esqueciSenhaUsuario({ body: { email: "marcos@fatec.sp.gov.br" } } as any, res);

    expect(res.status).toHaveBeenCalledWith(204);
    const [email, token] = mEmailRecuperacao.mock.calls[0];
    expect(email).toBe("marcos@fatec.sp.gov.br");
    const payload: any = jwt.verify(token, SECRET);
    expect(payload.id).toBe(7);
    expect(payload.exp - payload.iat).toBe(30 * 60);
  });

  it("esqueci a senha: 500 quando o e-mail não pode ser enviado", async () => {
    mUsuario.findOne.mockResolvedValue(usuarioDoBanco());
    mEmailRecuperacao.mockRejectedValueOnce(new Error("SMTP fora"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const res = resposta();
    await esqueciSenhaUsuario({ body: { email: "marcos@fatec.sp.gov.br" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  const redefinir = async (headers: Record<string, string>, novaSenha: string) => {
    const res = resposta();
    await redefirSenha({ headers, body: { novaSenha } } as any, res);
    return res;
  };
  const tokenValido = () => jwt.sign({ id: 7 }, SECRET, { expiresIn: "30min" });

  it("redefinir: 401 sem token", async () => {
    const res = await redefinir({}, "NovaSenha@1");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mUsuario.update).not.toHaveBeenCalled();
  });

  it("redefinir: 400 com senha fraca", async () => {
    const res = await redefinir({ authorization: `Bearer ${tokenValido()}` }, "fraca");
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mUsuario.update).not.toHaveBeenCalled();
  });

  it("redefinir: 204 e grava o hash da nova senha para o usuário do token", async () => {
    const res = await redefinir({ authorization: `Bearer ${tokenValido()}` }, "NovaSenha@1");
    expect(res.status).toHaveBeenCalledWith(204);
    const [dados, opcoes] = mUsuario.update.mock.calls[0];
    expect(await bcrypt.compare("NovaSenha@1", dados.senha)).toBe(true);
    expect(opcoes).toEqual({ where: { idUsuario: 7 } });
  });

  it("redefinir: aceita o token também no cabeçalho x-access-token, sem 'Bearer'", async () => {
    const res = await redefinir({ "x-access-token": tokenValido() }, "NovaSenha@1");
    expect(res.status).toHaveBeenCalledWith(204);
  });

  // Defeito encontrado: com token inválido a função responde 401, mas NÃO para.
  // Ela continua, valida a senha e chama UsuarioModel.update com idUsuario = 0.
  bug("redefinir: token inválido não altera nenhuma senha", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const res = await redefinir({ authorization: "Bearer token-falso" }, "NovaSenha@1");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mUsuario.update).not.toHaveBeenCalled();
  });
});

describe("Veículos (/api/veiculo)", () => {
  it("listarTodos: 200 com a lista", async () => {
    mVeiculo.findAll.mockResolvedValue([{ Modelo: "Gol" }]);
    const res = resposta();
    await listarTodos({} as any, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{ Modelo: "Gol" }]);
  });

  it("listarTodos: 500 quando o banco falha", async () => {
    mVeiculo.findAll.mockRejectedValue(new Error("falhou"));
    const res = resposta();
    await listarTodos({} as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("listarPorUsuario: 404 quando o usuário não tem veículo", async () => {
    mVeiculo.findOne.mockResolvedValue(null);
    const res = resposta();
    await listarPorUsuario({ params: { idUsuario: "7" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("listarPorUsuario: 200 com o veículo", async () => {
    mVeiculo.findOne.mockResolvedValue({ Modelo: "Gol" });
    const res = resposta();
    await listarPorUsuario({ params: { idUsuario: "7" } } as any, res);
    expect(mVeiculo.findOne).toHaveBeenCalledWith({ where: { idUsuario: 7 } });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("listarPorUsuario: 500 quando o banco falha", async () => {
    mVeiculo.findOne.mockRejectedValue(new Error("falhou"));
    const res = resposta();
    await listarPorUsuario({ params: { idUsuario: "7" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("criarVeiculo: 400 sem idUsuario", async () => {
    const res = resposta();
    await criarVeiculo({ body: { Modelo: "Gol" } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mVeiculo.create).not.toHaveBeenCalled();
  });

  it("criarVeiculo: 201 e converte o ano para número", async () => {
    mVeiculo.create.mockResolvedValue({ idVeiculo: 1 });
    const res = resposta();
    await criarVeiculo({ body: { idUsuario: 7, Placa_veiculo: "ABC1D23", Cor: "Preto", Modelo: "Gol", Ano: "2018" } } as any, res);
    expect(mVeiculo.create).toHaveBeenCalledWith(expect.objectContaining({ Ano: 2018, idUsuario: 7 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("criarVeiculo: 400 quando o banco recusa os dados", async () => {
    mVeiculo.create.mockRejectedValue(new Error("Placa inválida"));
    const res = resposta();
    await criarVeiculo({ body: { idUsuario: 7 } } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ erro: "Placa inválida" });
  });
});
