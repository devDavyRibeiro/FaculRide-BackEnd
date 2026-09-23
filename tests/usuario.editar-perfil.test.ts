import { mUsuario, mVeiculo } from "./helpers/mocks"; // <- sempre o 1º import
import request from "supertest";
import { app, auth, PNG_1x1 } from "./helpers/app";
import { bug } from "./helpers/bug";

/**
 * Cartão Trello: "Testar Editar perfil" (Faculride, lista Doing).
 * A numeração dos describes segue a descrição do cartão (1 ... 6).
 */

let usuarioBanco: { idUsuario: number; tipoUsuario: string; update: jest.Mock };

beforeEach(() => {
  usuarioBanco = {
    idUsuario: 1,
    tipoUsuario: "passageiro",
    update: jest.fn().mockResolvedValue(undefined),
  };
  mUsuario.findByPk.mockResolvedValue(usuarioBanco);
});

const novosDados = {
  nome: "Nome Novo",
  telefone: "15988887777",
  cep: "18110000",
  endereco: "Rua Nova",
  numero: "200",
  cidade: "Sorocaba",
  estado: "SP",
  fatec: "Fatec Votorantim",
};

describe("1. Atualização dos dados cadastrais (PUT /api/usuario/:id)", () => {
  it("exige autenticação (401 sem token)", async () => {
    const res = await request(app).put("/api/usuario/1").send(novosDados);
    expect(res.status).toBe(401);
  });

  it("200 'Usuário atualizado com sucesso' e repassa os novos dados para o update", async () => {
    const res = await request(app).put("/api/usuario/1").set(auth(1)).send(novosDados);
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe("Usuário atualizado com sucesso");
    expect(mUsuario.findByPk).toHaveBeenCalledWith(1);
    expect(usuarioBanco.update).toHaveBeenCalledWith(expect.objectContaining(novosDados));
  });

  it("erro de banco no update => 500 com a mensagem", async () => {
    usuarioBanco.update.mockRejectedValue(new Error("falha no banco"));
    const res = await request(app).put("/api/usuario/1").set(auth(1)).send(novosDados);
    expect(res.status).toBe(500);
    expect(res.body.erro).toBe("falha no banco");
  });

  // O cartão diz: "o registro do usuário na tabela usuario E veiculo devem ser atualizados".
  // O handler só atualiza `usuario`; veículo só muda por /api/veiculo. Confirmar com o time se
  // o contrato do cartão está certo; se estiver, é defeito.
  bug("atualiza também a tabela veiculo quando o motorista envia dados do veículo", async () => {
    usuarioBanco.tipoUsuario = "motorista";
    const veiculoNovo = { Placa_veiculo: "XYZ9K88", Cor: "Branco", Modelo: "Onix", Ano: 2020 };
    const res = await request(app)
      .put("/api/usuario/1")
      .set(auth(1, "motorista"))
      .send({ ...novosDados, veiculo: veiculoNovo });
    expect(res.status).toBe(200);
    const veiculoAtualizado =
      mVeiculo.update.mock.calls.length > 0 || mVeiculo.create.mock.calls.length > 0;
    expect(veiculoAtualizado).toBe(true);
  });
});

describe("2. Edição de usuário não encontrado", () => {
  it("PUT /:id com id inexistente => 404 'Usuário não encontrado'", async () => {
    mUsuario.findByPk.mockResolvedValue(null);
    const res = await request(app).put("/api/usuario/9999").set(auth(1)).send(novosDados);
    expect(res.status).toBe(404);
    expect(res.body.erro).toBe("Usuário não encontrado");
  });
});

describe("3. Atualização da foto de perfil (PUT /api/usuario/foto/update e PATCH /api/usuario/foto)", () => {
  const enviar = (rota: "put" | "patch", contentType = "image/png") => {
    const url = rota === "put" ? "/api/usuario/foto/update" : "/api/usuario/foto";
    return request(app)[rota](url).set(auth(1)).attach("file", PNG_1x1, { filename: "nova", contentType });
  };

  it("PUT e PATCH exigem autenticação (401 sem token)", async () => {
    const put = await request(app)
      .put("/api/usuario/foto/update")
      .attach("file", PNG_1x1, { filename: "n.png", contentType: "image/png" });
    expect(put.status).toBe(401);

    const patch = await request(app)
      .patch("/api/usuario/foto")
      .attach("file", PNG_1x1, { filename: "n.png", contentType: "image/png" });
    expect(patch.status).toBe(401);
  });

  it("PUT sem arquivo => 400", async () => {
    const res = await request(app).put("/api/usuario/foto/update").set(auth(1));
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe("Envie um arquivo em 'file' (multipart/form-data)");
  });

  it.each(["image/jpeg", "image/png", "image/webp"])("PUT com %s => 200", async (tipo) => {
    const res = await enviar("put", tipo);
    expect(res.status).toBe(200);
  });

  // Achado: diferente do upload inicial, a ATUALIZAÇÃO não valida o tipo do arquivo.
  bug("PUT recusa formato inválido (gif/pdf/exe) com 400, como no upload inicial", async () => {
    for (const tipo of ["image/gif", "application/pdf", "application/x-msdownload"]) {
      const res = await enviar("put", tipo);
      expect(res.status).toBe(400);
    }
  });

  // Cartão: apagar a foto antiga, subir a nova ao storage e responder 200 com a nova URL (`url`).
  // Na develop o bloco de S3 está comentado e a resposta não traz URL nenhuma.
  bug("PUT retorna 200 com a nova URL gerada (campo `url`)", async () => {
    const res = await enviar("put");
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/^https?:\/\//);
  });

  it.todo("PUT deleta a foto antiga no Azure Blob e faz upload da nova (depende de 'Adaptar serviços para Azure')");
});

describe("4. Atualização da foto da CNH (POST /api/usuario/cnh/upload)", () => {
  it("motorista envia novo arquivo válido => 200", async () => {
    usuarioBanco.tipoUsuario = "motorista";
    const res = await request(app)
      .post("/api/usuario/cnh/upload")
      .set(auth(1, "motorista"))
      .attach("file", PNG_1x1, { filename: "cnh.pdf", contentType: "application/pdf" });
    expect(res.status).toBe(200);
  });

  it.todo("substitui o arquivo antigo no Azure Blob e atualiza cnhFotoUrl/cnhFotoPath no PostgreSQL (depende do Azure)");
});

describe("5. Remoção da foto de perfil (DELETE /api/usuario/foto/delete)", () => {
  it("exige autenticação (401 sem token)", async () => {
    const res = await request(app).delete("/api/usuario/foto/delete");
    expect(res.status).toBe(401);
  });

  it("200 'Foto do usuário deletada com sucesso'", async () => {
    const res = await request(app).delete("/api/usuario/foto/delete").set(auth(1));
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe("Foto do usuário deletada com sucesso");
  });

  it.todo("remove de fato o arquivo do Azure Blob (o texto do cartão ainda cita S3; hoje o handler devolve 200 sem apagar nada)");
});

describe("6. Remoção da CNH (DELETE /api/usuario/cnh/delete)", () => {
  // O cartão descreve este endpoint, mas ele NÃO existe em usuario.routes.ts: a chamada cai no 404 padrão do Express.
  bug("endpoint existe e responde 200 para o motorista autenticado", async () => {
    usuarioBanco.tipoUsuario = "motorista";
    const res = await request(app).delete("/api/usuario/cnh/delete").set(auth(1, "motorista"));
    expect(res.status).toBe(200);
  });

  it.todo("remove o arquivo no Azure Blob e limpa cnhFotoUrl/cnhFotoPath (a mensagem do cartão repete a da foto: confirmar texto)");
});

describe("Achados adicionais (segurança) — PUT/DELETE /api/usuario/:id", () => {
  // Qualquer usuário autenticado consegue editar/apagar QUALQUER outro pelo id da URL:
  // o handler ignora o id do token (IDOR / falta de checagem de dono).
  bug("usuário 1 não pode editar o perfil do usuário 2 (403)", async () => {
    const res = await request(app).put("/api/usuario/2").set(auth(1)).send({ nome: "Invadido" });
    expect(res.status).toBe(403);
    expect(usuarioBanco.update).not.toHaveBeenCalled();
  });

  bug("usuário 1 não pode deletar o usuário 2 (403)", async () => {
    usuarioBanco.idUsuario = 2;
    Object.assign(usuarioBanco, { destroy: jest.fn().mockResolvedValue(undefined) });
    mVeiculo.destroy.mockResolvedValue(0);
    const res = await request(app).delete("/api/usuario/2").set(auth(1));
    expect(res.status).toBe(403);
    expect((usuarioBanco as any).destroy).not.toHaveBeenCalled();
  });

  // O PUT repassa req.body inteiro para o model (mass assignment): dá para gravar senha em texto puro.
  bug("PUT /:id não grava senha em texto puro", async () => {
    await request(app).put("/api/usuario/1").set(auth(1)).send({ senha: "123" });
    expect(usuarioBanco.update).not.toHaveBeenCalledWith(expect.objectContaining({ senha: "123" }));
  });

  // Idem: passageiro vira motorista sem CNH, contornando a regra do cadastro.
  bug("PUT /:id não permite trocar tipoUsuario", async () => {
    await request(app).put("/api/usuario/1").set(auth(1)).send({ tipoUsuario: "motorista" });
    expect(usuarioBanco.update).not.toHaveBeenCalledWith(expect.objectContaining({ tipoUsuario: "motorista" }));
  });
});
