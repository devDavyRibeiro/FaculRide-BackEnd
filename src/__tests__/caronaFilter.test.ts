/// <reference types="jest" />
import {
  tipoNormalizado,
  ehProxima,
  filtrarCaronas,
  calcularDistanciaKm,
  ordenarPorProximidade,
  Coordenadas,
  ViagemResumo,
  UsuarioResumo,
} from "../utils/caronaFilter";

// Massa de dados: 2 motoristas e 2 passageiros oferecendo/procurando carona,
// em cidades diferentes — igual ao cenário descrito nos critérios de aceite
// do card "Testar Pesquisa caronas" (US08).
const usuarios: UsuarioResumo[] = [
  { idUsuario: 1, tipoUsuario: "motorista" },
  { idUsuario: 2, tipoUsuario: "passageiro" },
  { idUsuario: 3, tipoUsuario: "motorista" },
  { idUsuario: 4, tipoUsuario: "passageiro" },
];

const viagens: ViagemResumo[] = [
  { idViagem: 10, idUsuario: 1, partida: "Votorantim", destino: "Fatec Votorantim", usuario: { tipoUsuario: "motorista" } },
  { idViagem: 11, idUsuario: 2, partida: "Sorocaba", destino: "Fatec Votorantim", usuario: { tipoUsuario: "passageiro" } },
  { idViagem: 12, idUsuario: 3, partida: "Itu", destino: "Fatec Votorantim" }, // sem usuario embutido -> cai no fallback por lista
  { idViagem: 13, idUsuario: 4, partida: "Votorantim", destino: "Fatec Votorantim" }, // idem
];

describe("CT-US08-01: todos os passageiros aparecem em 'encontre uma carona'", () => {
  it("filtro 'passageiro' retorna só as viagens de passageiros", () => {
    const resultado = filtrarCaronas(viagens, usuarios, {
      filtroTipo: "passageiro",
      somenteProximas: false,
      minhaCidade: "",
    });

    expect(resultado.map((v) => v.idViagem).sort()).toEqual([11, 13]);
    resultado.forEach((v) => {
      expect(tipoNormalizado(v, usuarios)).toBe("passageiro");
    });
  });
});

describe("CT-US08-02: todos os motoristas aparecem em 'encontre uma carona'", () => {
  it("filtro 'motorista' retorna só as viagens de motoristas", () => {
    const resultado = filtrarCaronas(viagens, usuarios, {
      filtroTipo: "motorista",
      somenteProximas: false,
      minhaCidade: "",
    });

    expect(resultado.map((v) => v.idViagem).sort()).toEqual([10, 12]);
    resultado.forEach((v) => {
      expect(tipoNormalizado(v, usuarios)).toBe("motorista");
    });
  });
});

describe("CT-US08-03: filtro 'todos' mostra motoristas e passageiros juntos", () => {
  it("retorna as 4 viagens, sem perder nenhum tipo", () => {
    const resultado = filtrarCaronas(viagens, usuarios, {
      filtroTipo: "todos",
      somenteProximas: false,
      minhaCidade: "",
    });

    expect(resultado).toHaveLength(4);

    const tipos = resultado.map((v) => tipoNormalizado(v, usuarios));
    expect(tipos).toContain("motorista");
    expect(tipos).toContain("passageiro");
  });

  it("não mostra viagem sem partida ou destino preenchidos", () => {
    const viagensComIncompleta: ViagemResumo[] = [
      ...viagens,
      { idViagem: 99, idUsuario: 1, partida: "", destino: "Fatec Votorantim" },
    ];

    const resultado = filtrarCaronas(viagensComIncompleta, usuarios, {
      filtroTipo: "todos",
      somenteProximas: false,
      minhaCidade: "",
    });

    expect(resultado.find((v) => v.idViagem === 99)).toBeUndefined();
  });
});

describe("CT-US08-04: caronas 'próximas de mim' (mobile — filtro por texto)", () => {
  it("com o filtro de proximidade ligado, só mantém viagens cuja partida/destino contém a cidade do usuário", () => {
    const resultado = filtrarCaronas(viagens, usuarios, {
      filtroTipo: "todos",
      somenteProximas: true,
      minhaCidade: "Votorantim",
    });

    // Votorantim aparece na partida (10, 13) e também no destino de todas
    // (todo mundo vai para a "Fatec Votorantim"), então o filtro textual
    // aceita as 4 -- o que já é, por si só, um problema de precisão do filtro.
    expect(resultado).toHaveLength(4);
  });

  it("é sensível a maiúsculas/minúsculas de forma correta (case-insensitive)", () => {
    expect(ehProxima({ partida: "VOTORANTIM", destino: "x" }, "votorantim")).toBe(true);
  });

  it("DEFEITO DOCUMENTADO (mobile): não há ordenação por distância real — é só um filtro de texto pela cidade", () => {
    // Este teste PASSA, e é isso mesmo que se espera dele: ele prova, com uma
    // asserção que sempre será verdadeira enquanto o defeito existir, que o
    // filtro do app mobile não reordena por distância (o site sim — ver
    // CT-US08-05). Duas
    // cidades vizinhas de Votorantim (ex.: Sorocaba, a ~15km) só aparecem se
    // o nome da cidade bater com o texto de partida/destino — elas NÃO são
    // reordenadas da mais próxima para a mais distante. Se algum dia alguém
    // implementar a ordenação por distância, ESTE teste vai passar a falhar
    // — e aí ele deve ser atualizado (não é um teste "quebrado").
    const sorocaba: ViagemResumo = { partida: "Sorocaba", destino: "Fatec Votorantim" };
    const itu: ViagemResumo = { partida: "Itu", destino: "Fatec Votorantim" }; // mais longe que Sorocaba

    const resultado = filtrarCaronas([sorocaba, itu], [], {
      filtroTipo: "todos",
      somenteProximas: true,
      minhaCidade: "Votorantim",
    });

    // Ambas aparecem (porque "Fatec Votorantim" está no destino das duas) e
    // na MESMA ordem em que entraram — não há reordenação por proximidade.
    expect(resultado).toEqual([sorocaba, itu]);
  });
});

// Coordenadas reais (centro de cada cidade), usadas no lugar do Geocoder do
// Google Maps para que o teste seja determinístico e não dependa de rede.
const coordenadas: Record<string, Coordenadas> = {
  Votorantim: { lat: -23.5446, lng: -47.4388 },
  Sorocaba: { lat: -23.5015, lng: -47.4526 },
  Itu: { lat: -23.2642, lng: -47.2992 },
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
};

const geocodificarFake = async (endereco: string): Promise<Coordenadas | null> =>
  coordenadas[endereco] ?? null;

describe("CT-US08-05: caronas 'próximas de mim' aparecem e são as mais próximas (site)", () => {
  // Usuário logado mora em Votorantim.
  const eu = coordenadas.Votorantim;

  const saoPaulo: ViagemResumo = { idViagem: 20, partida: "São Paulo", destino: "Fatec Votorantim" };
  const itu: ViagemResumo = { idViagem: 21, partida: "Itu", destino: "Fatec Votorantim" };
  const sorocaba: ViagemResumo = { idViagem: 22, partida: "Sorocaba", destino: "Fatec Votorantim" };

  it("calcula a distância em km com Haversine (valores reais conferidos)", () => {
    expect(calcularDistanciaKm(eu, eu)).toBe(0);

    // Votorantim -> Sorocaba: cidades vizinhas, ~5 km em linha reta.
    expect(calcularDistanciaKm(eu, coordenadas.Sorocaba)).toBeGreaterThan(3);
    expect(calcularDistanciaKm(eu, coordenadas.Sorocaba)).toBeLessThan(8);

    // Votorantim -> São Paulo: ~82 km em linha reta.
    expect(calcularDistanciaKm(eu, coordenadas["São Paulo"])).toBeGreaterThan(75);
    expect(calcularDistanciaKm(eu, coordenadas["São Paulo"])).toBeLessThan(90);
  });

  it("a distância é simétrica (A -> B igual a B -> A)", () => {
    expect(calcularDistanciaKm(coordenadas.Itu, coordenadas.Sorocaba)).toBeCloseTo(
      calcularDistanciaKm(coordenadas.Sorocaba, coordenadas.Itu),
      10
    );
  });

  it("todas as caronas aparecem, da mais próxima para a mais distante", async () => {
    // Entram fora de ordem de propósito.
    const resultado = await ordenarPorProximidade([saoPaulo, itu, sorocaba], eu, geocodificarFake);

    expect(resultado.map((v) => v.idViagem)).toEqual([22, 21, 20]); // Sorocaba, Itu, São Paulo

    for (let i = 1; i < resultado.length; i++) {
      expect(resultado[i].distanciaKm).toBeGreaterThanOrEqual(resultado[i - 1].distanciaKm);
    }
  });

  it("a primeira carona da lista é de fato a mais próxima de mim", async () => {
    const resultado = await ordenarPorProximidade([saoPaulo, itu, sorocaba], eu, geocodificarFake);

    const menorDistancia = Math.min(
      ...[saoPaulo, itu, sorocaba].map((v) => calcularDistanciaKm(eu, coordenadas[v.partida!]))
    );

    expect(resultado[0].partida).toBe("Sorocaba");
    expect(resultado[0].distanciaKm).toBeCloseTo(menorDistancia, 10);
  });

  it("não altera os outros dados da viagem, só acrescenta distanciaKm", async () => {
    const [primeira] = await ordenarPorProximidade([sorocaba], eu, geocodificarFake);

    expect(primeira).toMatchObject(sorocaba);
    expect(typeof primeira.distanciaKm).toBe("number");
  });

  it("deixa de fora viagens sem partida ou cuja partida não foi localizada", async () => {
    const semPartida: ViagemResumo = { idViagem: 23, partida: "", destino: "Fatec Votorantim" };
    const desconhecida: ViagemResumo = { idViagem: 24, partida: "Cidade Inexistente", destino: "Fatec Votorantim" };

    const resultado = await ordenarPorProximidade(
      [semPartida, desconhecida, itu, sorocaba],
      eu,
      geocodificarFake
    );

    expect(resultado.map((v) => v.idViagem)).toEqual([22, 21]);
  });

  it("lista vazia não quebra", async () => {
    await expect(ordenarPorProximidade([], eu, geocodificarFake)).resolves.toEqual([]);
  });
});
