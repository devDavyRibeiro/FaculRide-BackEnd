import { Request, Response } from "express";
import { Op } from "sequelize";
import { ConversaCaronaModel } from "../models/conversa_carona.model";
import { MensagemConversaModel } from "../models/mensagem_conversa.model";
import { UsuarioModel } from "../models/usuario.model";
import { ViagemModel } from "../models/viagem.model";

// ================= INICIAR CONVERSA =================
export const iniciarConversa = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idPassageiro = user?.id ?? user?.idUsuario;

    const { idViagem } = req.body;

    if (!idPassageiro || !idViagem) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const viagem = await ViagemModel.findByPk(idViagem);

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    // Não permite iniciar conversa em viagem cancelada
    if (viagem.cancelada) {
      return res.status(400).json({ erro: "Não é possível iniciar conversa em uma viagem cancelada" });
    }

    const idMotorista = viagem.idUsuario;

    // 1) tenta achar uma conversa já existente
    const conversaExistente = await ConversaCaronaModel.findOne({
      where: {
        idViagem,
        idMotorista,
        idPassageiro,
      },
    });

    if (conversaExistente) {
      const conversaCompleta = await ConversaCaronaModel.findByPk(
        conversaExistente.idConversa,
        {
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
        }
      );

      return res.status(200).json(conversaCompleta || conversaExistente);
    }

    let novaConversa;

    try {
      // 2) cria a conversa
      novaConversa = await ConversaCaronaModel.create({
        idViagem,
        idMotorista,
        idPassageiro,
      });
    } catch (error: any) {
      // Se duas requisições chegarem juntas, a constraint UNIQUE do banco pode barrar uma delas.
      // Nesse caso, buscamos a conversa já criada e devolvemos normalmente.
      const conversaRecuperada = await ConversaCaronaModel.findOne({
        where: {
          idViagem,
          idMotorista,
          idPassageiro,
        },
      });

      if (conversaRecuperada) {
        const conversaCompleta = await ConversaCaronaModel.findByPk(
          conversaRecuperada.idConversa,
          {
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
          }
        );

        return res.status(200).json(conversaCompleta || conversaRecuperada);
      }

      throw error;
    }

    // 3) mensagem automática inicial
    await MensagemConversaModel.create({
      idConversa: novaConversa.idConversa,
      idRemetente: idPassageiro,
      mensagem: "Oi! Tenho interesse na sua carona. Podemos alinhar os detalhes?",
    });

    // 4) busca novamente completa
    const conversaCompleta = await ConversaCaronaModel.findByPk(
      novaConversa.idConversa,
      {
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
      }
    );

    return res.status(201).json(conversaCompleta || novaConversa);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= LISTAR MINHAS CONVERSAS =================
export const listarMinhasConversas = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const idUsuario = user?.id ?? user?.idUsuario;

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
    const { idConversa } = req.params;

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
    const idRemetente = user?.id ?? user?.idUsuario;

    const { idConversa, mensagem } = req.body;

    if (!idConversa) {
      return res.status(400).json({ erro: "Conversa não informada" });
    }

    if (!mensagem || mensagem.trim().length < 1) {
      return res.status(400).json({ erro: "Mensagem vazia" });
    }

    const conversa = await ConversaCaronaModel.findByPk(idConversa, {
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

    // Não permite mensagem em viagem cancelada
    if ((conversa as any).viagem?.cancelada) {
      return res.status(400).json({ erro: "Não é possível enviar mensagem em uma viagem cancelada" });
    }

    const novaMensagem = await MensagemConversaModel.create({
      idConversa,
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
    const idUsuario = user?.id ?? user?.idUsuario;

    const { idConversa } = req.params;

    const conversa = await ConversaCaronaModel.findByPk(idConversa);

    if (!conversa) {
      return res.status(404).json({ erro: "Conversa não encontrada" });
    }

    const viagem = await ViagemModel.findByPk(conversa.idViagem);

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    // Não permite aceitar viagem cancelada
    if (viagem.cancelada) {
      return res.status(400).json({ erro: "Não é possível aceitar uma viagem cancelada" });
    }

    if (conversa.idMotorista === idUsuario) {
      conversa.aceiteMotorista = true;
    }

    if (conversa.idPassageiro === idUsuario) {
      conversa.aceitePassageiro = true;
    }

    if (conversa.aceiteMotorista && conversa.aceitePassageiro) {
      conversa.status = "aceita";

      // Cancelar outras conversas da mesma viagem
      await ConversaCaronaModel.update(
        {
          status: "recusada",
          aceiteMotorista: false,
          aceitePassageiro: false,
        },
        {
          where: {
            idViagem: conversa.idViagem,
            idConversa: {
              [Op.ne]: conversa.idConversa, // todas menos a atual
            },
          },
        }
      );
    } else {
      conversa.status = "aguardando_confirmacao";
    }

    await conversa.save();

    return res.json(conversa);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};

// ================= RECUSAR CARONA =================
export const recusarCarona = async (req: Request, res: Response) => {
  try {
    const { idConversa } = req.params;

    const conversa = await ConversaCaronaModel.findByPk(idConversa);

    if (!conversa) {
      return res.status(404).json({ erro: "Conversa não encontrada" });
    }

    const viagem = await ViagemModel.findByPk(conversa.idViagem);

    if (!viagem) {
      return res.status(404).json({ erro: "Viagem não encontrada" });
    }

    // Não permite recusar viagem cancelada
    if (viagem.cancelada) {
      return res.status(400).json({ erro: "A viagem já foi cancelada" });
    }

    conversa.status = "recusada";

    await conversa.save();

    return res.json(conversa);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
};