export interface Iusuario {
  idUsuario?: number;
  nome: string;
  cpf: string;
  ra: string;
  fatec: string;
  dataNascimento: Date;
  genero: boolean; // true = masculino, false = feminino
  cep: string;
  endereco: string;
  numero: string;
  cidade: string;
  estado: string;
  email: string;
  telefone: string;
  senha: string;
  tipoUsuario: "passageiro" | "motorista";
  cnh?: string; // somente para motoristas
  fotoUrl?: string | null;
  fotoPath?: string | null;
}

export interface IusuarioFiltros {
  nome?: string;
  email?: string;
  tipoUsuario?: "passageiro" | "motorista";
}

export interface IRetornoCadastroUsuario {
  id: number;
}
