/**
 * AuthorizeMiddleware: protege as rotas autenticadas da API.
 * Partição de equivalência do cabeçalho de autenticação:
 *   válidas   -> "Bearer <token válido>", "<token válido>" sem Bearer, x-access-token
 *   inválidas -> sem cabeçalho, token adulterado, token expirado
 */
import jwt from "jsonwebtoken";
import { AuthorizeMiddleware } from "../src/middlewares/authorize.middleware";

const SECRET = process.env.JWT_SECRET!;

function executar(req: Record<string, unknown>) {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.sendStatus = jest.fn().mockReturnValue(res);
  const next = jest.fn();
  // Usa o mesmo objeto (sem copiar) para o teste conseguir ler o req.user gravado.
  const requisicao: any = Object.assign(req, { method: req.method ?? "GET", headers: req.headers ?? {} });
  AuthorizeMiddleware(requisicao, res, next);
  return { res, next, req: requisicao };
}

const token = (payload: object, opcoes: jwt.SignOptions = { expiresIn: "1h" }) => jwt.sign(payload, SECRET, opcoes);

describe("AuthorizeMiddleware", () => {
  it("libera requisições OPTIONS (preflight de CORS) com 204", () => {
    const { res, next } = executar({ method: "OPTIONS" });
    expect(res.sendStatus).toHaveBeenCalledWith(204);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 sem cabeçalho de autenticação", () => {
    const { res, next } = executar({});
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "Token não fornecido." });
    expect(next).not.toHaveBeenCalled();
  });

  it("401 com token adulterado", () => {
    const { res, next } = executar({ headers: { authorization: "Bearer abc.def.ghi" } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("401 com token expirado", () => {
    const expirado = token({ id: 1 }, { expiresIn: -10 });
    const { res, next } = executar({ headers: { authorization: `Bearer ${expirado}` } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "Token inválido ou expirado." });
    expect(next).not.toHaveBeenCalled();
  });

  it("aceita 'Bearer <token>' e grava o usuário na requisição", () => {
    const req: any = { headers: { authorization: `Bearer ${token({ id: 3, nome: "Ana", tipoUsuario: "passageiro" })}` } };
    const { next } = executar(req);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ id: 3, idUsuario: 3, nome: "Ana", tipoUsuario: "passageiro" });
  });

  it("aceita o token sem o prefixo Bearer, no cabeçalho x-access-token", () => {
    const req: any = { headers: { "x-access-token": token({ idUsuario: 4, tipoUsuario: "motorista" }) } };
    const { next } = executar(req);
    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe(4);
  });

  it("401 quando a leitura do cabeçalho gera erro inesperado", () => {
    const req: any = {
      method: "GET",
      get headers(): any {
        throw new Error("cabeçalho corrompido");
      },
    };
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    AuthorizeMiddleware(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ erro: "Falha na autenticação." });
  });
});
