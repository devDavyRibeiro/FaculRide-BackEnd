export interface IUsuarioResumoViagem {
  nome: string;
  email: string;
  telefone: string;
  genero: boolean;
}

export interface IAgendamentoResumoViagem {
  idAgendamento: number;
  data: string;
}

export interface IConversaResumoViagem {
  idConversa: number;
  status: string;
  aceiteMotorista: boolean;
  aceitePassageiro: boolean;
  idMotorista: number;
  idPassageiro: number;
}

export type StatusViagem =
  | "pendente"
  | "aceita"
  | "recusada"
  | "concluida"
  | "cancelada";

export interface Iviagem {
  idViagem: number;
  tipoUsuario: string;
  partida: string;
  destino: string;
  horarioEntrada: string;
  horarioSaida: string;
  ajudaDeCusto: string;
  idUsuario: number;

  cancelada?: boolean;
  canceladaPor?: number | null;
  dataCancelamento?: Date | null;

  usuario?: IUsuarioResumoViagem;
  agendamentos?: IAgendamentoResumoViagem[];
  conversas?: IConversaResumoViagem[];
  statusViagem?: StatusViagem;
}