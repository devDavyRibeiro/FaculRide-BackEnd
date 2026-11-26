/**
 * Testes baseados em estados: status da viagem (resolverStatusViagem).
 *
 * Estados: pendente, aceita, recusada, concluida, cancelada.
 * Os nomes T1..T7 (transições) e C1..C5 (caminhos) são os mesmos do diagrama
 * de estados apresentado no card "Testes baseados em estados" e na apresentação.
 *
 * O status depende do dia e da hora atuais, então o relógio é fixado em
 * 26/11/2026 às 10:00 para que os testes deem sempre o mesmo resultado.
 */
import { resolverStatusViagem } from "../src/utils/viagemStatus";

const HOJE = "2026-11-26";
const ONTEM = "2026-11-25";
const AMANHA = "2026-11-27";

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 10, 26, 10, 0, 0)); // 26/11/2026 10:00 (horário local)
});

afterAll(() => {
  jest.useRealTimers();
});

const conversaAceita = { status: "aceita" };
const conversaRecusada = { status: "recusada" };
const conversaPendente = { status: "pendente" };

describe("Estado inicial", () => {
  it("T0: viagem sem nenhuma conversa fica 'pendente'", () => {
    expect(resolverStatusViagem({})).toBe("pendente");
  });

  it("T0: conversa ainda sem resposta mantém 'pendente'", () => {
    expect(resolverStatusViagem({ conversas: [conversaPendente] })).toBe("pendente");
  });
});

describe("Transições válidas", () => {
  it("T1: pendente -> aceita quando a conversa tem status 'aceita'", () => {
    expect(resolverStatusViagem({ conversas: [conversaAceita] })).toBe("aceita");
  });

  it("T1: pendente -> aceita quando motorista E passageiro deram aceite", () => {
    const conversas = [{ status: "pendente", aceiteMotorista: true, aceitePassageiro: true }];
    expect(resolverStatusViagem({ conversas })).toBe("aceita");
  });

  it("T2: pendente -> recusada quando o motorista recusa", () => {
    expect(resolverStatusViagem({ conversas: [conversaRecusada] })).toBe("recusada");
  });

  it("T3: aceita -> concluida quando a data agendada já passou", () => {
    const viagem = { conversas: [conversaAceita], agendamentos: [{ data: ONTEM }], horarioSaida: "18:00" };
    expect(resolverStatusViagem(viagem)).toBe("concluida");
  });

  it("T3: aceita -> concluida no próprio dia, depois do horário de saída", () => {
    const viagem = { conversas: [conversaAceita], agendamentos: [{ data: HOJE }], horarioSaida: "07:30" };
    expect(resolverStatusViagem(viagem)).toBe("concluida");
  });

  it("T4: pendente -> cancelada", () => {
    expect(resolverStatusViagem({ cancelada: true })).toBe("cancelada");
  });

  it("T5: aceita -> cancelada", () => {
    expect(resolverStatusViagem({ cancelada: true, conversas: [conversaAceita] })).toBe("cancelada");
  });

  it("T6: recusada -> cancelada", () => {
    expect(resolverStatusViagem({ cancelada: true, conversas: [conversaRecusada] })).toBe("cancelada");
  });

  it("T7: recusada -> aceita quando outra conversa da mesma viagem é aceita", () => {
    expect(resolverStatusViagem({ conversas: [conversaRecusada, conversaAceita] })).toBe("aceita");
  });
});

describe("Transições que NÃO devem acontecer (guardas)", () => {
  it.each([
    ["só o motorista aceitou", { aceiteMotorista: true, aceitePassageiro: false }],
    ["só o passageiro aceitou", { aceiteMotorista: false, aceitePassageiro: true }],
  ])("aceite de um lado só não muda para 'aceita' (%s)", (_nome, conversa) => {
    expect(resolverStatusViagem({ conversas: [conversa] })).toBe("pendente");
  });

  it("aceita com data agendada no futuro continua 'aceita'", () => {
    const viagem = { conversas: [conversaAceita], agendamentos: [{ data: AMANHA }], horarioSaida: "07:00" };
    expect(resolverStatusViagem(viagem)).toBe("aceita");
  });

  it("aceita no próprio dia, antes do horário de saída, continua 'aceita'", () => {
    const viagem = { conversas: [conversaAceita], agendamentos: [{ data: HOJE }], horarioSaida: "18:00" };
    expect(resolverStatusViagem(viagem)).toBe("aceita");
  });

  it("aceita sem nenhuma data agendada não é concluída", () => {
    expect(resolverStatusViagem({ conversas: [conversaAceita], horarioSaida: "07:00" })).toBe("aceita");
  });

  it("pendente com data que já passou continua 'pendente' (só conclui se foi aceita)", () => {
    expect(resolverStatusViagem({ agendamentos: [{ data: ONTEM }] })).toBe("pendente");
  });

  it.each([["25:00"], ["10:60"], ["abc"], [""], [null]])(
    "horário de saída inválido (%p) no dia da viagem não conclui",
    (horarioSaida) => {
      const viagem = { conversas: [conversaAceita], agendamentos: [{ data: HOJE }], horarioSaida };
      expect(resolverStatusViagem(viagem)).toBe("aceita");
    }
  );
});

describe("Regras de prioridade", () => {
  it("cancelada vence todos os outros estados, inclusive concluída", () => {
    const viagem = { cancelada: true, conversas: [conversaAceita], agendamentos: [{ data: ONTEM }] };
    expect(resolverStatusViagem(viagem)).toBe("cancelada");
  });

  it("com uma conversa aceita e outra recusada, prevalece 'aceita'", () => {
    expect(resolverStatusViagem({ conversas: [conversaAceita, conversaRecusada] })).toBe("aceita");
  });

  it("o status da conversa é comparado sem diferenciar maiúsculas e espaços", () => {
    expect(resolverStatusViagem({ conversas: [{ status: "  ACEITA " }] })).toBe("aceita");
    expect(resolverStatusViagem({ conversas: [{ status: "Recusada" }] })).toBe("recusada");
  });

  it("com várias datas agendadas, vale a primeira (mais antiga)", () => {
    const viagem = {
      conversas: [conversaAceita],
      agendamentos: [{ data: AMANHA }, { data: null }, { data: ONTEM }],
      horarioSaida: "18:00",
    };
    expect(resolverStatusViagem(viagem)).toBe("concluida");
  });
});

describe("Caminhos completos (sequência de eventos)", () => {
  // Cada caminho simula a viagem mudando ao longo do tempo e confere o estado após cada evento.
  const executar = (eventos: Array<Record<string, unknown>>) => {
    let viagem: Record<string, any> = {};
    return eventos.map((evento) => {
      viagem = { ...viagem, ...evento };
      return resolverStatusViagem(viagem);
    });
  };

  it("C1: pendente -> aceita -> concluida", () => {
    const estados = executar([
      {},
      { conversas: [conversaAceita], agendamentos: [{ data: AMANHA }] },
      { agendamentos: [{ data: ONTEM }] },
    ]);
    expect(estados).toEqual(["pendente", "aceita", "concluida"]);
  });

  it("C2: pendente -> recusada", () => {
    expect(executar([{}, { conversas: [conversaRecusada] }])).toEqual(["pendente", "recusada"]);
  });

  it("C3: pendente -> aceita -> cancelada", () => {
    const estados = executar([{}, { conversas: [conversaAceita] }, { cancelada: true }]);
    expect(estados).toEqual(["pendente", "aceita", "cancelada"]);
  });

  it("C4: pendente -> recusada -> aceita -> concluida", () => {
    const estados = executar([
      {},
      { conversas: [conversaRecusada] },
      { conversas: [conversaRecusada, conversaAceita], agendamentos: [{ data: AMANHA }] },
      { agendamentos: [{ data: ONTEM }] },
    ]);
    expect(estados).toEqual(["pendente", "recusada", "aceita", "concluida"]);
  });

  it("C5: cancelada é estado final (um aceite depois do cancelamento não muda nada)", () => {
    const estados = executar([{}, { cancelada: true }, { conversas: [conversaAceita] }]);
    expect(estados).toEqual(["pendente", "cancelada", "cancelada"]);
  });
});
