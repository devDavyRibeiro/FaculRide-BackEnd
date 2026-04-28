import { Iviagem } from "../interfaces/Iviagem";
import { ViagemModel } from "../models/viagem.model";
import { UsuarioModel } from "../models/usuario.model";
import { ViajemAgendadaModel } from "../models/viajem_agendada.model";
import { ConversaCaronaModel } from "../models/conversa_carona.model";
import { resolverStatusViagem } from "../utils/viagemStatus";

// GET viagem
export const listAll = async (): Promise<Iviagem[]> => {
  const viagens = await ViagemModel.findAll({
    include: [
      {
        model: UsuarioModel,
        as: 'usuario',
        attributes: ['nome', 'email', 'telefone', 'genero']
      },
      // Inclusão agendamentos da viagem (se existirem)
      {
        model: ViajemAgendadaModel,
        as: 'agendamentos',
        attributes: ['idAgendamento', 'data']
      },
      // Inclusão conversas da viagem para calcular o status real
      {
        model: ConversaCaronaModel,
        as: 'conversas',
        attributes: [
          'idConversa',
          'status',
          'aceiteMotorista',
          'aceitePassageiro',
          'idMotorista',
          'idPassageiro'
        ]
      }
    ]
  });

  return viagens.map((viagem: any) => {
    const viagemJson = viagem.toJSON();

    const statusViagem = resolverStatusViagem({
      horarioSaida: viagemJson.horarioSaida,
      agendamentos: viagemJson.agendamentos || [],
      conversas: viagemJson.conversas || [],
      cancelada: viagemJson.cancelada || false
    });

    return {
      ...viagemJson,
      statusViagem
    };
  });
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

  // Se tiver datasAgendadas, cria registros em viajem_agendada
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

// PATCH cancelar viagem
export const cancelarViagem = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const idUsuario = user?.id ?? user?.idUsuario;

    const viagem = await ViagemModel.findByPk(Number(id));

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    if (viagem.cancelada) {
      return res.status(400).json({ erro: "A viagem já está cancelada" });
    }

    // Regra atual: somente o dono da viagem pode cancelar
    if (viagem.idUsuario !== idUsuario) {
      return res.status(403).json({ erro: "Somente o motorista pode cancelar esta viagem" });
    }

    await viagem.update({
      cancelada: true,
      canceladaPor: idUsuario,
      dataCancelamento: new Date()
    });

    // Reflete o cancelamento nas conversas vinculadas
    await ConversaCaronaModel.update(
      {
        status: "cancelada",
        aceiteMotorista: false,
        aceitePassageiro: false
      },
      {
        where: {
          idViagem: viagem.idViagem
        }
      }
    );

    return res.status(200).json({
      mensagem: "Viagem cancelada com sucesso",
      viagem
    });
  } catch (error: any) {
    return res.status(500).json({ erro: error.message || "Erro ao cancelar viagem" });
  }
};

// DELETE viagem
export const remove = (id: number): Promise<boolean> => {
  return ViagemModel.findByPk(id).then(viagem => {
    if (!viagem) return false;
    return viagem.destroy().then(() => true);
  });
};