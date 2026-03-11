import { Iviagem } from "../interfaces/Iviagem";
import { ViagemModel } from "../models/viagem.model";
import { UsuarioModel } from "../models/usuario.model";
import { ViajemAgendadaModel } from "../models/viajem_agendada.model";

// GET viagem
export const listAll = (): Promise<Iviagem[]> => {
  return ViagemModel.findAll({
    include: [
      {
        model: UsuarioModel,
        as: 'usuario',
        attributes: ['nome', 'email', 'telefone', 'genero']
      },
      // NOVO: incluir agendamentos da viagem (se existirem)
      {
        model: ViajemAgendadaModel,
        as: 'agendamentos',
        attributes: ['idAgendamento', 'data']
      }
    ]
  }) as unknown as Promise<Iviagem[]>; // cast só pra manter o tipo de retorno
};

// POST viagem
// Agora aceitamos um campo extra opcional: datasAgendadas: string[]
export const create = async (
  dados: Iviagem & { datasAgendadas?: string[] }
): Promise<Iviagem> => {

  // Se vier datasAgendadas no body, separamos
  const { datasAgendadas, ...dadosViagem } = dados as any;

  // Cria a viagem normalmente (como já fazia antes)
  const viagem = await ViagemModel.create(dadosViagem as Iviagem);

  // NOVO: se tiver datasAgendadas, cria registros em viajem_agendada
  if (datasAgendadas && Array.isArray(datasAgendadas) && datasAgendadas.length) {
    const registros = datasAgendadas.map((dataISO) => ({
      idViagem: viagem.idViagem,
      data: dataISO
    }));

    await ViajemAgendadaModel.bulkCreate(registros);
  }

  return viagem as unknown as Iviagem;
};

// PUT viagem
export const update = (id: number, dados: Iviagem): Promise<Iviagem | null> => {
  return ViagemModel.findByPk(id).then(viagem => {
    if (!viagem) return null;
    return viagem.update(dados);
  });
};

// DELETE viagem
export const remove = (id: number): Promise<boolean> => {
  return ViagemModel.findByPk(id).then(viagem => {
    if (!viagem) return false;
    return viagem.destroy().then(() => true);
  });
};
