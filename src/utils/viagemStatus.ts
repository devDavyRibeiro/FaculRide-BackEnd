export type StatusViagem =
  | "pendente"
  | "aceita"
  | "recusada"
  | "concluida"
  | "cancelada";

type ConversaResumo = {
  status?: string | null;
  aceiteMotorista?: boolean;
  aceitePassageiro?: boolean;
};

type AgendamentoResumo = {
  data?: string | null;
};

type ViagemStatusInput = {
  horarioSaida?: string | null;
  agendamentos?: AgendamentoResumo[];
  conversas?: ConversaResumo[];

  // 🔥 NOVO (sem remover nada)
  cancelada?: boolean | null;
};

function parseHorarioParaMinutos(horario?: string | null): number | null {
  if (!horario) return null;

  const match = String(horario).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const horas = Number(match[1]);
  const minutos = Number(match[2]);

  if (
    Number.isNaN(horas) ||
    Number.isNaN(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return null;
  }

  return horas * 60 + minutos;
}

function getHojeLocalISO(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function getAgoraEmMinutos(): number {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

function normalizarStatusConversa(status?: string | null): string {
  return String(status || "").trim().toLowerCase();
}

function existeConversaAceita(conversas: ConversaResumo[] = []): boolean {
  return conversas.some((conversa) => {
    const status = normalizarStatusConversa(conversa.status);

    if (status === "aceita") return true;

    const aceiteMotorista = Boolean(conversa.aceiteMotorista);
    const aceitePassageiro = Boolean(conversa.aceitePassageiro);

    return aceiteMotorista && aceitePassageiro;
  });
}

function existeConversaRecusada(conversas: ConversaResumo[] = []): boolean {
  return conversas.some((conversa) => {
    const status = normalizarStatusConversa(conversa.status);
    return status === "recusada";
  });
}

function obterPrimeiraDataAgendada(
  agendamentos: AgendamentoResumo[] = []
): string | null {
  const datasValidas = agendamentos
    .map((ag) => ag.data)
    .filter((data): data is string => Boolean(data))
    .sort(); // YYYY-MM-DD ordena corretamente em string

  if (!datasValidas.length) return null;

  return datasValidas[0];
}

function viagemJaAconteceu(
  primeiraDataAgendada: string | null,
  horarioSaida?: string | null
): boolean {
  if (!primeiraDataAgendada) return false;

  const hojeISO = getHojeLocalISO();

  if (primeiraDataAgendada < hojeISO) {
    return true;
  }

  if (primeiraDataAgendada > hojeISO) {
    return false;
  }

  const minutosHorarioSaida = parseHorarioParaMinutos(horarioSaida);
  if (minutosHorarioSaida === null) {
    return false;
  }

  return getAgoraEmMinutos() >= minutosHorarioSaida;
}

export function resolverStatusViagem(
  viagem: ViagemStatusInput
): StatusViagem {
  const conversas = viagem.conversas || [];
  const agendamentos = viagem.agendamentos || [];

  if (viagem.cancelada) {
    return "cancelada";
  }

  const temAceita = existeConversaAceita(conversas);
  const temRecusada = existeConversaRecusada(conversas);
  const primeiraDataAgendada = obterPrimeiraDataAgendada(agendamentos);
  const jaAconteceu = viagemJaAconteceu(
    primeiraDataAgendada,
    viagem.horarioSaida
  );

  if (temAceita && jaAconteceu) {
    return "concluida";
  }

  if (temAceita) {
    return "aceita";
  }

  if (temRecusada) {
    return "recusada";
  }

  return "pendente";
}