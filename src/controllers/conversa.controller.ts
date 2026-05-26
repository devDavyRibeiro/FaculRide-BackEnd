import { Request, Response } from "express";
import { Op } from "sequelize";
import { ConversaCaronaModel } from "../models/conversa_carona.model";
import { MensagemConversaModel } from "../models/mensagem_conversa.model";
import { UsuarioModel } from "../models/usuario.model";
import { ViagemModel } from "../models/viagem.model";

const buscarConversaCompleta = async (idConversa: number) => {
  return ConversaCaronaModel.findByPk(idConversa, {
    include: [
      {
        model: ViagemModel,
        as: "viagem",
      },
      {
        model: UsuarioModel,
        as: "motorista",
        attributes: { exclude: ["senha"] },
      },
      {
        model: UsuarioModel,
        as: "passageiro",
        attributes: { exclude: ["senha"] },
      },
    ],
  });
};

// ================= INICIAR CONVERSA =================
export const iniciarConversa = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idPassageiro = Number(user?.id ?? user?.idUsuario);

    const { idViagem } = req.body;
    const idViagemNumero = Number(idViagem);

    if (!idPassageiro || !idViagemNumero) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const viagem = await ViagemModel.findByPk(idViagemNumero);

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    const viagemJson = viagem.toJSON() as any;

    if (viagemJson.cancelada) {
      return res.status(400).json({
        erro: "Não é possível iniciar conversa em uma viagem cancelada",
      });
    }

    const idMotorista = Number(
      viagem.getDataValue("idUsuario") ?? viagemJson.idUsuario
    );

    if (!idMotorista) {
      return res.status(400).json({ erro: "Motorista da viagem não encontrado" });
    }

    const conversaExistente = await ConversaCaronaModel.findOne({
      where: {
        idViagem: idViagemNumero,
        idMotorista,
        idPassageiro,
      },
    });

    if (conversaExistente) {
      const idConversaExistente = Number(
        conversaExistente.getDataValue("idConversa") ??
          (conversaExistente as any).idConversa
      );

      const conversaCompleta = await buscarConversaCompleta(idConversaExistente);

      return res.status(200).json(conversaCompleta || conversaExistente);
    }

    let novaConversa;

    try {
      novaConversa = await ConversaCaronaModel.create({
        idViagem: idViagemNumero,
        idMotorista,
        idPassageiro,
      });
    } catch (error: any) {
      const conversaRecuperada = await ConversaCaronaModel.findOne({
        where: {
          idViagem: idViagemNumero,
          idMotorista,
          idPassageiro,
        },
      });

      if (conversaRecuperada) {
        const idConversaRecuperada = Number(
          conversaRecuperada.getDataValue("idConversa") ??
            (conversaRecuperada as any).idConversa
        );

        const conversaCompleta = await buscarConversaCompleta(idConversaRecuperada);

        return res.status(200).json(conversaCompleta || conversaRecuperada);
      }

      throw error;
    }

    const idConversaNova = Number(
      novaConversa.getDataValue("idConversa") ??
        (novaConversa as any).idConversa
    );

    if (!idConversaNova) {
      return res.status(500).json({
        erro: "Conversa criada, mas o idConversa não foi retornado pelo banco",
      });
    }

    await MensagemConversaModel.create({
      idConversa: idConversaNova,
      idRemetente: idPassageiro,
      mensagem: "Oi! Tenho interesse na sua carona. Podemos alinhar os detalhes?",
    });

    const conversaCompleta = await buscarConversaCompleta(idConversaNova);

    return res.status(201).json(conversaCompleta || novaConversa);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= LISTAR MINHAS CONVERSAS =================
export const listarMinhasConversas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idUsuario = Number(user?.id ?? user?.idUsuario);

    const conversas = await ConversaCaronaModel.findAll({
      where: {
        [Op.or]: [{ idMotorista: idUsuario }, { idPassageiro: idUsuario }],
      },
      include: [
        {
          model: ViagemModel,
          as: "viagem",
        },
        {
          model: UsuarioModel,
          as: "motorista",
          attributes: { exclude: ["senha"] },
        },
        {
          model: UsuarioModel,
          as: "passageiro",
          attributes: { exclude: ["senha"] },
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.json(conversas);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= LISTAR MENSAGENS =================
export const listarMensagens = async (req: Request, res: Response) => {
  try {
    const idConversa = Number(req.params.idConversa);

    const mensagens = await MensagemConversaModel.findAll({
      where: { idConversa },
      include: [
        {
          model: UsuarioModel,
          as: "remetente",
          attributes: { exclude: ["senha"] },
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.json(mensagens);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= ENVIAR MENSAGEM =================
export const enviarMensagem = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idRemetente = Number(user?.id ?? user?.idUsuario);

    const { idConversa, mensagem } = req.body;
    const idConversaNumero = Number(idConversa);

    if (!idConversaNumero) {
      return res.status(400).json({ erro: "Conversa não informada" });
    }

    if (!mensagem || mensagem.trim().length < 1) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    const conversa = await ConversaCaronaModel.findByPk(idConversaNumero, {
      include: [
        {
          model: ViagemModel,
          as: "viagem",
        },
      ],
    });

    if (!conversa) {
      return res.status(404).json({ erro: "Conversa não encontrada" });
    }

    if ((conversa as any).viagem?.cancelada) {
      return res.status(400).json({
        erro: "Não é possível enviar mensagem em uma viagem cancelada",
      });
    }

    const novaMensagem = await MensagemConversaModel.create({
      idConversa: idConversaNumero,
      idRemetente,
      mensagem: mensagem.trim(),
    });

    return res.status(201).json(novaMensagem);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= ACEITAR CARONA =================
export const aceitarCarona = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idUsuario = Number(user?.id ?? user?.idUsuario);

    const idConversa = Number(req.params.idConversa);

    const conversa = await ConversaCaronaModel.findByPk(idConversa);

    if (!conversa) {
      return res.status(404).json({ erro: "Conversa não encontrada" });
    }

    const conversaJson = conversa.toJSON() as any;

    const idViagemConversa = Number(
      conversa.getDataValue("idViagem") ?? conversaJson.idViagem
    );

    const idMotorista = Number(
      conversa.getDataValue("idMotorista") ?? conversaJson.idMotorista
    );

    const idPassageiro = Number(
      conversa.getDataValue("idPassageiro") ?? conversaJson.idPassageiro
    );

    const viagem = await ViagemModel.findByPk(idViagemConversa);

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    const viagemJson = viagem.toJSON() as any;

    if (viagemJson.cancelada) {
      return res.status(400).json({
        erro: "Não é possível aceitar uma viagem cancelada",
      });
    }

    if (idMotorista === idUsuario) {
      conversa.setDataValue("aceiteMotorista", true);
    }

    if (idPassageiro === idUsuario) {
      conversa.setDataValue("aceitePassageiro", true);
    }

    const aceiteMotorista = Boolean(
      conversa.getDataValue("aceiteMotorista") ?? (conversa as any).aceiteMotorista
    );

    const aceitePassageiro = Boolean(
      conversa.getDataValue("aceitePassageiro") ?? (conversa as any).aceitePassageiro
    );

    if (aceiteMotorista && aceitePassageiro) {
      conversa.setDataValue("status", "aceita");

      await ConversaCaronaModel.update(
        {
          status: "recusada",
          aceiteMotorista: false,
          aceitePassageiro: false,
        },
        {
          where: {
            idViagem: idViagemConversa,
            idConversa: {
              [Op.ne]: idConversa,
            },
          },
        }
      );
    } else {
      conversa.setDataValue("status", "aguardando_confirmacao");
    }

    await conversa.save();

    const conversaCompleta = await buscarConversaCompleta(idConversa);

    return res.json(conversaCompleta || conversa);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= RECUSAR CARONA =================
export const recusarCarona = async (req: Request, res: Response) => {
  try {
    const idConversa = Number(req.params.idConversa);

    const conversa = await ConversaCaronaModel.findByPk(idConversa);

    if (!conversa) {
      return res.status(404).json({ erro: "Conversa não encontrada" });
    }

    const conversaJson = conversa.toJSON() as any;

    const idViagemConversa = Number(
      conversa.getDataValue("idViagem") ?? conversaJson.idViagem
    );

    const viagem = await ViagemModel.findByPk(idViagemConversa);

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    const viagemJson = viagem.toJSON() as any;

    if (viagemJson.cancelada) {
      return res.status(400).json({ erro: "A viagem já foi cancelada" });
    }

    conversa.setDataValue("status", "recusada");

    await conversa.save();

    const conversaCompleta = await buscarConversaCompleta(idConversa);

    return res.json(conversaCompleta || conversa);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};