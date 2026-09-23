import express from "express";
import jwt from "jsonwebtoken";
import usuarioRoutes from "../../src/routes/usuario.routes";

/**
 * Sobe SÓ as rotas de /api/usuario (com o AuthorizeMiddleware real).
 * Não usamos src/app.ts porque ele chama server.listen() e carrega
 * segredos da AWS ao ser importado.
 */
export const app = express();
app.use(express.json());
app.use("/api/usuario", usuarioRoutes);

export function tokenDe(id: number, tipoUsuario: "passageiro" | "motorista" = "passageiro") {
  return jwt.sign({ id, nome: `Usuario ${id}`, tipoUsuario }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
}

export const auth = (id: number, tipo: "passageiro" | "motorista" = "passageiro") => ({
  Authorization: `Bearer ${tokenDe(id, tipo)}`,
});

/** Payload válido de passageiro, seguindo a lista de campos obrigatórios do cartão. */
export function passageiroValido(over: Record<string, unknown> = {}) {
  return {
    tipoUsuario: "passageiro",
    nome: "Aluno Teste",
    cpf: "12345678909",
    ra: "1234567890123",
    fatec: "Fatec Votorantim",
    dataNascimento: "2000-01-15",
    genero: "Outro",
    cep: "18110000",
    endereco: "Rua das Flores",
    numero: "100",
    cidade: "Votorantim",
    estado: "SP",
    email: "aluno@fatec.sp.gov.br",
    telefone: "15999990000",
    senha: "Senha@123",
    ...over,
  };
}

export function motoristaValido(over: Record<string, unknown> = {}) {
  return passageiroValido({
    tipoUsuario: "motorista",
    cnh: "12345678900",
    veiculo: { Placa_veiculo: "ABC1D23", Cor: "Preto", Modelo: "Gol", Ano: 2018 },
    ...over,
  });
}

/** PNG mínimo válido (1x1) para uploads. */
export const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);
