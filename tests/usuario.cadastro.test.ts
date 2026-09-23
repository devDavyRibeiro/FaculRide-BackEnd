import { mUsuario, mVeiculo, mSequelize, mEmailBoasVindas } from "./helpers/mocks"; // <- sempre o 1º import
import request from "supertest";
import bcrypt from "bcryptjs";
import { app, auth, passageiroValido, motoristaValido, PNG_1x1 } from "./helpers/app";
import { bug } from "./helpers/bug";

/**
 * Cartão Trello: "Testar o cadastro de usuários" (Faculride, lista Doing).
 * A numeração dos describes segue a descrição do cartão (1.1 ... 4).
 */

const tx = { commit: jest.fn(), rollback: jest.fn() };

beforeEach(() => {
  mUsuario.findOne.mockResolvedValue(null); // nenhum RA/CPF/e-mail duplicado
  mSequelize.transaction.mockResolvedValue(tx);
  mUsuario.create.mockImplementation(async (data: any) => ({
    ...data,
    getDataValue: (k: string) => (k === "idUsuario" ? 42 : undefined),
  }));
  mVeiculo.create.mockResolvedValue({});
});

const cadastrar = (body: object) => request(app).post("/api/usuario").send(body);
const amanha = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);

describe("1. Cadastro geral (validações)", () => {
  describe("1.1 Tipo de usuário", () => {
    it.each(["admin", "ADMIN", "Passageiro", "", "aluno"])(
      "recusa tipoUsuario=%p com 400 'Tipo de usuário inválido'",
      async (tipo) => {
        const res = await cadastrar(passageiroValido({ tipoUsuario: tipo }));
        expect(res.status).toBe(400);
        expect(res.body.erro).toBe("Tipo de usuário inválido");
        expect(mUsuario.create).not.toHaveBeenCalled();
      }
    );

    it("recusa quando tipoUsuario não é enviado", async () => {
      const { tipoUsuario, ...semTipo } = passageiroValido();
      const res = await cadastrar(semTipo);
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("Tipo de usuário inválido");
    });
  });

  describe("1.2 Data de nascimento", () => {
    it.each([["vazia", ""], ["ausente", undefined]])(
      "recusa data %s com 'Data de nascimento é obrigatória'",
      async (_nome, valor) => {
        const res = await cadastrar(passageiroValido({ dataNascimento: valor }));
        expect(res.status).toBe(400);
        expect(res.body.erro).toBe("Data de nascimento é obrigatória");
      }
    );

    it("recusa data futura com 'Data de nascimento inválida'", async () => {
      const res = await cadastrar(passageiroValido({ dataNascimento: amanha() }));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("Data de nascimento inválida");
    });

    it("recusa texto que não é data com 'Data de nascimento inválida'", async () => {
      const res = await cadastrar(passageiroValido({ dataNascimento: "31/02/abc" }));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("Data de nascimento inválida");
    });

    it("aceita data de hoje/passada", async () => {
      const res = await cadastrar(passageiroValido({ dataNascimento: "1990-06-30" }));
      expect(res.status).toBe(201);
    });
  });

  describe("1.3 RA (formato e unicidade)", () => {
    it.each([
      ["12 dígitos", "123456789012"],
      ["14 dígitos", "12345678901234"],
      ["vazio", ""],
      ["com letras (só 11 dígitos após limpar)", "12345678901AB"],
    ])("recusa RA %s", async (_nome, ra) => {
      const res = await cadastrar(passageiroValido({ ra }));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("RA deve conter exatamente 13 dígitos numéricos.");
    });

    it("normaliza RA com máscara antes de salvar", async () => {
      const res = await cadastrar(passageiroValido({ ra: "123.456.789-0123" }));
      expect(res.status).toBe(201);
      expect(mUsuario.create.mock.calls[0][0].ra).toBe("1234567890123");
    });

    it("recusa RA já cadastrado", async () => {
      mUsuario.findOne.mockImplementation(async ({ where }: any) =>
        where.ra === "1234567890123" ? { idUsuario: 7 } : null
      );
      const res = await cadastrar(passageiroValido());
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("RA já cadastrado para outro usuário.");
      expect(mUsuario.create).not.toHaveBeenCalled();
    });
  });

  describe("1.4 CPF (formato e unicidade)", () => {
    it.each([
      ["10 dígitos", "1234567890"],
      ["12 dígitos", "123456789012"],
      ["vazio", ""],
    ])("recusa CPF %s", async (_nome, cpf) => {
      const res = await cadastrar(passageiroValido({ cpf }));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("CPF deve conter exatamente 11 dígitos numéricos.");
    });

    it("normaliza CPF com máscara antes de salvar", async () => {
      const res = await cadastrar(passageiroValido({ cpf: "123.456.789-09" }));
      expect(res.status).toBe(201);
      expect(mUsuario.create.mock.calls[0][0].cpf).toBe("12345678909");
    });

    it("recusa CPF já cadastrado", async () => {
      mUsuario.findOne.mockImplementation(async ({ where }: any) =>
        where.cpf === "12345678909" ? { idUsuario: 7 } : null
      );
      const res = await cadastrar(passageiroValido());
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("CPF já cadastrado.");
    });

    // Achado: o código só confere a QUANTIDADE de dígitos, não o dígito verificador.
    bug("recusa CPF com 11 dígitos porém matematicamente inválido (ex.: 111.111.111-11)", async () => {
      const res = await cadastrar(passageiroValido({ cpf: "11111111111" }));
      expect(res.status).toBe(400);
    });
  });

  describe("1.5 E-mail (formato, unicidade e normalização)", () => {
    it.each(["semarroba.com", "a@b", "a b@c.com", "@fatec.com", ""])(
      "recusa e-mail inválido %p",
      async (email) => {
        const res = await cadastrar(passageiroValido({ email }));
        expect(res.status).toBe(400);
        expect(res.body.erro).toBe("E-mail inválido.");
      }
    );

    it("recusa e-mail já cadastrado", async () => {
      mUsuario.findOne.mockImplementation(async ({ where }: any) =>
        where.email === "aluno@fatec.sp.gov.br" ? { idUsuario: 7 } : null
      );
      const res = await cadastrar(passageiroValido());
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("E-mail já cadastrado.");
    });

    it("salva o e-mail em minúsculas e sem espaços (trim + toLowerCase)", async () => {
      const res = await cadastrar(passageiroValido({ email: "  ALUNO@Fatec.SP.gov.br  " }));
      expect(res.status).toBe(201);
      expect(mUsuario.create.mock.calls[0][0].email).toBe("aluno@fatec.sp.gov.br");
    });

    it("a checagem de duplicidade usa o e-mail já normalizado", async () => {
      await cadastrar(passageiroValido({ email: "  ALUNO@Fatec.SP.gov.br  " }));
      const consultas = mUsuario.findOne.mock.calls.map((c) => c[0].where);
      expect(consultas).toContainEqual({ email: "aluno@fatec.sp.gov.br" });
    });
  });

  describe("1.6 Senha (complexidade e criptografia)", () => {
    const MSG =
      "A senha deve conter no mínimo: 6 caracteres, 1 letra minúscula, 1 letra maiúscula, 1 número e 1 caractere especial (@$!%*#?&)";

    it.each([
      ["curta demais (5)", "Ab@12"],
      ["sem maiúscula", "senha@123"],
      ["sem minúscula", "SENHA@123"],
      ["sem número", "Senha@abc"],
      ["sem caractere especial", "Senha1234"],
      ["vazia", ""],
    ])("recusa senha %s", async (_nome, senha) => {
      const res = await cadastrar(passageiroValido({ senha }));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe(MSG);
      expect(mUsuario.create).not.toHaveBeenCalled();
    });

    it("aceita senha no limite mínimo (6 caracteres válidos)", async () => {
      const res = await cadastrar(passageiroValido({ senha: "Ab@123" }));
      expect(res.status).toBe(201);
    });

    it("grava a senha com bcrypt (fator 10) e nunca em texto puro", async () => {
      await cadastrar(passageiroValido({ senha: "Senha@123" }));
      const hash: string = mUsuario.create.mock.calls[0][0].senha;
      expect(hash).not.toBe("Senha@123");
      expect(hash).toMatch(/^\$2[aby]\$10\$/);
      expect(await bcrypt.compare("Senha@123", hash)).toBe(true);
    });

    // Achado de segurança: cadastrarUsuario faz console.log("Criptografando senha: ", hash),
    // e o logger da aplicação envia logs ao CloudWatch.
    bug("não registra o hash da senha nos logs", async () => {
      const spy = jest.spyOn(console, "log").mockImplementation(() => {});
      await cadastrar(passageiroValido());
      const vazou = spy.mock.calls.some((args) => args.some((a) => String(a).includes("$2")));
      spy.mockRestore();
      expect(vazou).toBe(false);
    });
  });
});

describe("2. Cadastro específico por tipo de usuário", () => {
  describe("2.1 Passageiro", () => {
    it("cadastra com todos os campos, retorna 201 com o id e dispara e-mail de boas-vindas", async () => {
      const res = await cadastrar(passageiroValido());
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 42 });
      expect(mUsuario.create).toHaveBeenCalledTimes(1);
      expect(mVeiculo.create).not.toHaveBeenCalled();
      expect(tx.commit).toHaveBeenCalledTimes(1);

      await new Promise((r) => setImmediate(r)); // e-mail é assíncrono (fire-and-forget)
      expect(mEmailBoasVindas).toHaveBeenCalledWith("aluno@fatec.sp.gov.br", "Aluno Teste");
    });

    it("falha no e-mail de boas-vindas NÃO derruba o cadastro", async () => {
      mEmailBoasVindas.mockRejectedValueOnce(new Error("SMTP fora do ar"));
      const res = await cadastrar(passageiroValido());
      expect(res.status).toBe(201);
    });
  });

  describe("2.2 Motorista (CNH e veículo)", () => {
    it("recusa motorista sem CNH", async () => {
      const res = await cadastrar(motoristaValido({ cnh: undefined }));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("Motoristas precisam informar o número da CNH");
      expect(mUsuario.create).not.toHaveBeenCalled();
    });

    it("cria usuário e veículo na MESMA transação e faz commit", async () => {
      const res = await cadastrar(motoristaValido());
      expect(res.status).toBe(201);
      expect(mUsuario.create).toHaveBeenCalledWith(expect.any(Object), { transaction: tx });
      expect(mVeiculo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          Placa_veiculo: "ABC1D23",
          Cor: "Preto",
          Modelo: "Gol",
          Ano: 2018,
          idUsuario: 42, // vínculo com o usuário recém-criado
        }),
        { transaction: tx }
      );
      expect(tx.commit).toHaveBeenCalledTimes(1);
      expect(tx.rollback).not.toHaveBeenCalled();
    });

    it("falha ao criar o veículo => rollback e nenhum commit", async () => {
      mVeiculo.create.mockRejectedValue(new Error("placa duplicada"));
      const res = await cadastrar(motoristaValido());
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("placa duplicada");
      expect(tx.rollback).toHaveBeenCalledTimes(1);
      expect(tx.commit).not.toHaveBeenCalled();
    });

    it("falha ao criar o usuário => rollback e nenhum veículo criado", async () => {
      mUsuario.create.mockRejectedValue(new Error("violação de unicidade"));
      const res = await cadastrar(motoristaValido());
      expect(res.status).toBe(400);
      expect(tx.rollback).toHaveBeenCalledTimes(1);
      expect(mVeiculo.create).not.toHaveBeenCalled();
    });

    it("id não gerado após o INSERT => rollback", async () => {
      mUsuario.create.mockResolvedValue({ getDataValue: () => undefined });
      const res = await cadastrar(motoristaValido());
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("ID do usuário não foi gerado após o cadastro.");
      expect(tx.rollback).toHaveBeenCalledTimes(1);
    });

    // Observação: a descrição do cartão fala em motorista "disponibilizando os dados do veículo",
    // mas o código aceita motorista com CNH e SEM veículo (cria só o usuário). Decidir se é regra.
    bug("recusa motorista sem dados de veículo (a confirmar com o time)", async () => {
      const res = await cadastrar(motoristaValido({ veiculo: undefined }));
      expect(res.status).toBe(400);
    });
  });
});

describe("3. Upload de documentação e mídia", () => {
  const usuarioComo = (tipoUsuario: string) => {
    const u = { idUsuario: 1, tipoUsuario, update: jest.fn().mockResolvedValue(undefined) };
    mUsuario.findByPk.mockResolvedValue(u);
    return u;
  };

  describe("3.1 Foto de perfil (POST /api/usuario/foto/upload)", () => {
    it("exige autenticação (401 sem token)", async () => {
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .attach("file", PNG_1x1, { filename: "f.png", contentType: "image/png" });
      expect(res.status).toBe(401);
    });

    it("recusa token inválido (401)", async () => {
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .set("Authorization", "Bearer lixo")
        .attach("file", PNG_1x1, { filename: "f.png", contentType: "image/png" });
      expect(res.status).toBe(401);
    });

    it("recusa requisição sem arquivo (400)", async () => {
      usuarioComo("passageiro");
      const res = await request(app).post("/api/usuario/foto/upload").set(auth(1));
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe("Envie um arquivo em 'file' (multipart/form-data)");
    });

    it.each(["image/gif", "application/pdf", "text/plain", "image/svg+xml"])(
      "recusa formato %s com 400 e a mensagem do cartão",
      async (contentType) => {
        usuarioComo("passageiro");
        const res = await request(app)
          .post("/api/usuario/foto/upload")
          .set(auth(1))
          .attach("file", Buffer.from("x"), { filename: "arq", contentType });
        expect(res.status).toBe(400);
        expect(res.body.erro).toBe("Formato inválido. Envie uma imagem JPG, PNG ou WEBP.");
      }
    );

    it.each(["image/jpeg", "image/png", "image/webp"])("aceita %s (200)", async (contentType) => {
      usuarioComo("passageiro");
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .set(auth(1))
        .attach("file", PNG_1x1, { filename: "foto", contentType });
      expect(res.status).toBe(200);
    });

    // O cartão pede: imagem enviada ao storage, URL pública gravada em `usuario`, status 200.
    // Na branch develop o código de S3 está COMENTADO e o endpoint devolve 200 sem enviar nem gravar nada.
    bug("envia ao storage e grava a URL pública em usuario (fotoUrl/fotoPath)", async () => {
      const u = usuarioComo("passageiro");
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .set(auth(1))
        .attach("file", PNG_1x1, { filename: "foto.png", contentType: "image/png" });
      expect(res.status).toBe(200);
      expect(res.body.url).toMatch(/^https?:\/\//);
      expect(u.update).toHaveBeenCalledWith(
        expect.objectContaining({ fotoUrl: expect.stringMatching(/^https?:\/\//) })
      );
    });

    // Limite do cartão: "até 5MB". O multer rejeita, mas o erro não é tratado => Express responde 500.
    bug("arquivo acima de 5MB é rejeitado com 4xx (hoje resulta em 500)", async () => {
      usuarioComo("passageiro");
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .set(auth(1))
        .attach("file", Buffer.alloc(5 * 1024 * 1024 + 1), { filename: "grande.png", contentType: "image/png" });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it("aceita arquivo logo abaixo do limite (5MB - 1 byte)", async () => {
      usuarioComo("passageiro");
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .set(auth(1))
        .attach("file", Buffer.alloc(5 * 1024 * 1024 - 1), { filename: "quase.png", contentType: "image/png" });
      expect(res.status).toBe(200);
    });

    // Borda: o cartão diz "até 5MB", mas um arquivo de EXATAMENTE 5MB é rejeitado
    // (o multer/busboy considera o limite atingido ao chegar em 5*1024*1024 bytes). Baixa gravidade.
    bug("aceita arquivo de exatamente 5MB", async () => {
      usuarioComo("passageiro");
      const res = await request(app)
        .post("/api/usuario/foto/upload")
        .set(auth(1))
        .attach("file", Buffer.alloc(5 * 1024 * 1024), { filename: "limite.png", contentType: "image/png" });
      expect(res.status).toBe(200);
    });
  });

  describe("3.2 Foto da CNH (POST /api/usuario/cnh/upload)", () => {
    const enviar = (id: number, tipo: "passageiro" | "motorista", contentType: string, buf = PNG_1x1) =>
      request(app)
        .post("/api/usuario/cnh/upload")
        .set(auth(id, tipo))
        .attach("file", buf, { filename: "cnh", contentType });

    it("passageiro recebe 403 'Apenas motoristas podem enviar foto da CNH'", async () => {
      usuarioComo("passageiro");
      const res = await enviar(1, "passageiro", "image/png");
      expect(res.status).toBe(403);
      expect(res.body.erro).toBe("Apenas motoristas podem enviar foto da CNH");
    });

    it("a regra de 403 vale mesmo que o token diga 'motorista' (usa o tipo gravado no banco)", async () => {
      usuarioComo("passageiro"); // banco diz passageiro
      const res = await enviar(1, "motorista", "image/png"); // token diz motorista
      expect(res.status).toBe(403);
    });

    it("usuário inexistente => 404", async () => {
      mUsuario.findByPk.mockResolvedValue(null);
      const res = await enviar(99, "motorista", "image/png");
      expect(res.status).toBe(404);
    });

    it("motorista sem arquivo => 400", async () => {
      usuarioComo("motorista");
      const res = await request(app).post("/api/usuario/cnh/upload").set(auth(1, "motorista"));
      expect(res.status).toBe(400);
    });

    it.each(["image/jpeg", "image/png", "image/webp", "application/pdf"])(
      "motorista envia %s => 200",
      async (contentType) => {
        usuarioComo("motorista");
        const res = await enviar(1, "motorista", contentType);
        expect(res.status).toBe(200);
      }
    );

    it.each(["image/gif", "text/plain", "application/zip"])(
      "motorista com formato %s => 400 'Formato inválido. Envie JPG, PNG, WEBP ou PDF.'",
      async (contentType) => {
        usuarioComo("motorista");
        const res = await enviar(1, "motorista", contentType);
        expect(res.status).toBe(400);
        expect(res.body.erro).toBe("Formato inválido. Envie JPG, PNG, WEBP ou PDF.");
      }
    );

    bug("processa no storage e atualiza cnhFotoUrl/cnhFotoPath no PostgreSQL", async () => {
      const u = usuarioComo("motorista");
      const res = await enviar(1, "motorista", "application/pdf");
      expect(res.status).toBe(200);
      expect(u.update).toHaveBeenCalledWith(
        expect.objectContaining({
          cnhFotoUrl: expect.stringMatching(/^https?:\/\//),
          cnhFotoPath: expect.any(String),
        })
      );
    });
  });
});

describe("4. Alteração de senha (PUT /api/usuario/alterar-senha)", () => {
  const SENHA_ATUAL = "Senha@123";
  let usuarioBanco: { senha: string; update: jest.Mock };

  beforeEach(async () => {
    usuarioBanco = {
      senha: await bcrypt.hash(SENHA_ATUAL, 4), // custo baixo só para o teste ficar rápido
      update: jest.fn().mockResolvedValue(undefined),
    };
    mUsuario.findByPk.mockResolvedValue(usuarioBanco);
  });

  const alterar = (body: object) =>
    request(app).put("/api/usuario/alterar-senha").set(auth(1)).send(body);

  it("exige autenticação (401 sem token)", async () => {
    const res = await request(app).put("/api/usuario/alterar-senha").send({});
    expect(res.status).toBe(401);
  });

  it.each([
    ["sem senhaAtual", { novaSenha: "Nova@123", confirmarSenha: "Nova@123" }],
    ["sem novaSenha", { senhaAtual: SENHA_ATUAL, confirmarSenha: "Nova@123" }],
    ["sem confirmarSenha", { senhaAtual: SENHA_ATUAL, novaSenha: "Nova@123" }],
    ["corpo vazio", {}],
  ])("400 quando faltam campos (%s)", async (_nome, body) => {
    const res = await alterar(body);
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe("Preencha senhaAtual, novaSenha e confirmarSenha");
  });

  it("400 quando novaSenha != confirmarSenha", async () => {
    const res = await alterar({ senhaAtual: SENHA_ATUAL, novaSenha: "Nova@123", confirmarSenha: "Outra@123" });
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe("Confirmação de senha não confere");
    expect(usuarioBanco.update).not.toHaveBeenCalled();
  });

  it("401 quando senhaAtual não bate com o hash do banco", async () => {
    const res = await alterar({ senhaAtual: "Errada@123", novaSenha: "Nova@123", confirmarSenha: "Nova@123" });
    expect(res.status).toBe(401);
    expect(res.body.erro).toBe("Senha atual incorreta");
    expect(usuarioBanco.update).not.toHaveBeenCalled();
  });

  it("200 e grava NOVO hash bcrypt quando tudo está correto", async () => {
    const res = await alterar({ senhaAtual: SENHA_ATUAL, novaSenha: "Nova@123", confirmarSenha: "Nova@123" });
    expect(res.status).toBe(200);
    expect(res.body.mensagem).toBe("Senha alterada com sucesso");
    const { senha } = usuarioBanco.update.mock.calls[0][0];
    expect(senha).not.toBe("Nova@123");
    expect(await bcrypt.compare("Nova@123", senha)).toBe(true);
  });

  it("404 quando o usuário do token não existe mais", async () => {
    mUsuario.findByPk.mockResolvedValue(null);
    const res = await alterar({ senhaAtual: SENHA_ATUAL, novaSenha: "Nova@123", confirmarSenha: "Nova@123" });
    expect(res.status).toBe(404);
  });

  // Achado: senha fraca cai no catch genérico e vira 500; é erro de entrada (deveria ser 400).
  bug("novaSenha fraca retorna 400 (hoje retorna 500)", async () => {
    const res = await alterar({ senhaAtual: SENHA_ATUAL, novaSenha: "fraca", confirmarSenha: "fraca" });
    expect(res.status).toBe(400);
    expect(usuarioBanco.update).not.toHaveBeenCalled();
  });
});
