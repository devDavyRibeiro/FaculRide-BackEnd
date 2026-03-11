import { AvaliacaoModel } from "../models/avaliacao.model";
import { IAvaliacao } from "../interfaces/Iavaliacao";
import { notifyUser } from "../utils/notifyUser"; 

// Listar todas as avaliações
export const listAll = async (): Promise<IAvaliacao[]> => {
  return await AvaliacaoModel.findAll();
};

// Criar nova avaliação
export const create = async (dados: IAvaliacao): Promise<IAvaliacao> => {
  if (!dados.Comentario || dados.Comentario.trim().length < 3) {
    throw new Error("O comentário deve conter pelo menos 3 caracteres.");
  }

  if (
    dados.Estrelas === undefined ||
    dados.Estrelas < 1 ||
    dados.Estrelas > 5
  ) {
    throw new Error("As estrelas devem ser um número entre 1 e 5.");
  }

  const nova = await AvaliacaoModel.create(dados);

  // Dispara notificação para o usuário avaliado (sem travar o fluxo se der erro)
  try {
    if (dados.ID_Avaliado) {
      await notifyUser({
        userId: dados.ID_Avaliado,
        type: "new_rating",
        title: "Você recebeu uma nova avaliação",
        message: `Você foi avaliado com ${dados.Estrelas} estrelas.`,
        metadata: {
          avaliacaoId:
            (nova as any).ID_Avaliacao ??
            (nova as any).id ??
            undefined,
          avaliadorId: dados.ID_Avaliador,
        },
      });
    }
  } catch (error) {
    console.error("[avaliacao] Falha ao enviar notificação:", error);
  }

  return nova;
};

// Atualizar avaliação
export const update = async (
  id: number,
  dados: IAvaliacao
): Promise<IAvaliacao | null> => {
  const avaliacao = await AvaliacaoModel.findByPk(id);
  if (!avaliacao) return null;

  if (dados.Comentario && dados.Comentario.trim().length < 3) {
    throw new Error("O comentário deve conter pelo menos 3 caracteres.");
  }

  if (
    dados.Estrelas !== undefined &&
    (dados.Estrelas < 1 || dados.Estrelas > 5)
  ) {
    throw new Error("As estrelas devem ser um número entre 1 e 5.");
  }

  await avaliacao.update(dados);
  return avaliacao as IAvaliacao;
};

// Remover avaliação
export const remove = async (id: number): Promise<boolean> => {
  const avaliacao = await AvaliacaoModel.findByPk(id);
  if (!avaliacao) return false;

  await avaliacao.destroy();
  return true;
};
