/**
 * Lógica de filtro da tela "Encontre uma carona" (US08).
 *
 * Este arquivo extrai, como funções puras e testáveis, a mesma lógica que já
 * existe hoje dentro do componente `app/(tabs)/encontre.tsx` do repositório
 * FaculRide-Mobile (funções `tipoNormalizado` e o `useMemo` de
 * `caronasDisponiveis`). Lá elas estão presas dentro de hooks do React, então
 * não dá pra testar sem renderizar o componente inteiro.
 *
 * Sugestão: importar estas funções dentro do encontre.tsx (no lugar do
 * código duplicado) para reaproveitar e manter só um lugar coberto por teste.
 */

export type TipoUsuario = "motorista" | "passageiro";
export type FiltroTipo = "todos" | TipoUsuario;

export interface UsuarioResumo {
  idUsuario?: number;
  id?: number;
  email?: string;
  tipoUsuario?: string;
  tipo_usuario?: string;
}

export interface ViagemResumo {
  idViagem?: number;
  id?: number;
  idUsuario?: number;
  partida?: string;
  destino?: string;
  tipoUsuario?: string;
  usuario?: UsuarioResumo;
}

/**
 * Descobre se a viagem é de um motorista ou de um passageiro.
 * Mesma regra da tela: usa o tipo embutido na própria viagem/usuário
 * relacionado; se não achar, procura na lista completa de usuários; se ainda
 * assim não achar, assume "passageiro" (mesmo comportamento do app hoje).
 */
export function tipoNormalizado(
  viagem: ViagemResumo,
  usuarios: UsuarioResumo[] = []
): TipoUsuario {
  const fromViagem = (viagem?.usuario?.tipoUsuario ?? viagem?.tipoUsuario ?? "")
    .toString()
    .trim()
    .toLowerCase();

  if (fromViagem === "motorista" || fromViagem === "passageiro") {
    return fromViagem;
  }

  const uid = Number(viagem?.idUsuario);
  const usuario = usuarios.find((u) => Number(u?.idUsuario ?? u?.id) === uid);

  const fromUsuario = (usuario?.tipoUsuario ?? usuario?.tipo_usuario ?? "")
    .toString()
    .trim()
    .toLowerCase();

  return fromUsuario === "motorista" ? "motorista" : "passageiro";
}

/**
 * Filtro de "proximidade" usado hoje pelo app MOBILE: verifica se a cidade do
 * usuário logado aparece como substring do texto de partida ou destino.
 *
 * IMPORTANTE: no mobile isto NÃO é uma ordenação por distância geográfica
 * real — é apenas um filtro textual por nome de cidade. Já o SITE
 * (FaculRide-FRONT-AWS, `mapa.component.ts`) calcula distância real com
 * Haversine; essa lógica está reproduzida mais abaixo em
 * `calcularDistanciaKm` / `ordenarPorProximidade`.
 */
export function ehProxima(
  viagem: ViagemResumo,
  minhaCidade: string
): boolean {
  const cidade = (minhaCidade || "").trim().toLowerCase();
  if (!cidade) return true;

  const partida = (viagem.partida || "").toLowerCase();
  const destino = (viagem.destino || "").toLowerCase();

  return partida.includes(cidade) || destino.includes(cidade);
}

/**
 * Reproduz o `caronasDisponiveis` (useMemo) da tela: aplica o filtro de tipo
 * (todos / motorista / passageiro) e, opcionalmente, o filtro de "só
 * próximas de mim".
 */
export function filtrarCaronas(
  viagens: ViagemResumo[],
  usuarios: UsuarioResumo[],
  opcoes: {
    filtroTipo: FiltroTipo;
    somenteProximas: boolean;
    minhaCidade: string;
  }
): ViagemResumo[] {
  const { filtroTipo, somenteProximas, minhaCidade } = opcoes;

  return viagens.filter((v) => {
    if (!v.partida || !v.destino) return false;

    const tipo = tipoNormalizado(v, usuarios);

    if (filtroTipo !== "todos" && tipo !== filtroTipo) {
      return false;
    }

    if (somenteProximas && minhaCidade) {
      if (!ehProxima(v, minhaCidade)) return false;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Proximidade real (site)
//
// Reproduz, como funções puras, a lógica de `calcularDistanciaKm` e
// `calcularCaronasProximas` do componente `src/app/mapa/mapa.component.ts`
// do repositório FaculRide-FRONT-AWS (filtro "Próximas de mim" do site).
// Lá a geocodificação usa o Geocoder do Google Maps; aqui ela é recebida como
// parâmetro, para que o teste possa usar coordenadas fixas.
// ---------------------------------------------------------------------------

export interface Coordenadas {
  lat: number;
  lng: number;
}

export type ViagemComDistancia = ViagemResumo & { distanciaKm: number };

/** Distância em linha reta entre dois pontos (fórmula de Haversine), em km. */
export function calcularDistanciaKm(origem: Coordenadas, destino: Coordenadas): number {
  const raioTerraKm = 6371;

  const toRad = (valor: number) => (valor * Math.PI) / 180;

  const dLat = toRad(destino.lat - origem.lat);
  const dLng = toRad(destino.lng - origem.lng);

  const lat1 = toRad(origem.lat);
  const lat2 = toRad(destino.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return raioTerraKm * c;
}

/**
 * Calcula a distância entre o usuário e a PARTIDA de cada viagem e devolve as
 * viagens ordenadas da mais próxima para a mais distante. Mesmo comportamento
 * do site: viagens sem partida, ou cuja partida não pôde ser geocodificada,
 * ficam de fora da lista.
 */
export async function ordenarPorProximidade(
  viagens: ViagemResumo[],
  coordenadasUsuario: Coordenadas,
  geocodificar: (endereco: string) => Promise<Coordenadas | null>
): Promise<ViagemComDistancia[]> {
  const viagensCalculadas: ViagemComDistancia[] = [];

  for (const viagem of viagens) {
    const partida = String(viagem?.partida || "").trim();

    if (!partida) continue;

    const coordenadasPartida = await geocodificar(partida);

    if (!coordenadasPartida) continue;

    viagensCalculadas.push({
      ...viagem,
      distanciaKm: calcularDistanciaKm(coordenadasUsuario, coordenadasPartida),
    });
  }

  return viagensCalculadas.sort((a, b) => a.distanciaKm - b.distanciaKm);
}
