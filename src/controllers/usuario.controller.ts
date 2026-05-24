import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { enviarEmailBoasVindas } from "../utils/email";
dotenv.config();

import sequelize from "../config/database";
import { UsuarioModel } from "../models/usuario.model";
import { VeiculoModel } from "../models/veiculo.model";
import { LogAcessoModel } from "../models/logAcesso.model";
import { Iusuario, IRetornoCadastroUsuario, IusuarioFiltros } from "../interfaces/Iusuario";
import { IVeiculo } from "../interfaces/Iveiculo";
import { supabaseAdmin } from "../config/supabase";
import { uploadArquivoS3, getArquivoS3byID } from "../utils/s3Client";
import { insertS3, findS3ById } from "../utils/moogose";

// Validação de senha forte
function validarSenha(senha: string) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
  if (!regex.test(senha)) {
    throw new Error(
      "A senha deve conter no mínimo: 6 caracteres, 1 letra minúscula, 1 letra maiúscula, 1 número e 1 caractere especial (@$!%*#?&)"
    );
  }
}

// Cadastro de usuário
export const cadastrarUsuario = async (usuario: Iusuario): Promise<IRetornoCadastroUsuario> => {
  const tiposPermitidos = ["passageiro", "motorista"];

  if (!tiposPermitidos.includes(usuario.tipoUsuario)) {
    throw new Error("Tipo de usuário inválido");
  }

  if (usuario.tipoUsuario === "motorista" && !usuario.cnh) {
    throw new Error("Motoristas precisam informar o número da CNH");
  }

  if (!usuario.dataNascimento) {
    throw new Error("Data de nascimento é obrigatória");
  }

  const dataNascimento = new Date(usuario.dataNascimento);
  const hoje = new Date();
  if (isNaN(dataNascimento.getTime()) || dataNascimento > hoje) {
    throw new Error("Data de nascimento inválida");
  }

  // RA — 13 dígitos + unicidade
  const raSomenteDigitos = String(usuario.ra ?? "").replace(/\D/g, "");
  if (!/^\d{13}$/.test(raSomenteDigitos)) {
    throw new Error("RA deve conter exatamente 13 dígitos numéricos.");
  }
  usuario.ra = raSomenteDigitos;

  const raJaExiste = await UsuarioModel.findOne({ where: { ra: usuario.ra } });
  if (raJaExiste) {
    throw new Error("RA já cadastrado para outro usuário.");
  }

  // CPF — 11 dígitos + unicidade
  const cpfSomenteDigitos = String(usuario.cpf ?? "").replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpfSomenteDigitos)) {
    throw new Error("CPF deve conter exatamente 11 dígitos numéricos.");
  }
  usuario.cpf = cpfSomenteDigitos;

  const cpfJaExiste = await UsuarioModel.findOne({ where: { cpf: usuario.cpf } });
  if (cpfJaExiste) {
    throw new Error("CPF já cadastrado.");
  }

  // E-mail — formato + unicidade
  const emailNormalizado = String(usuario.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    throw new Error("E-mail inválido.");
  }

  const emailJaExiste = await UsuarioModel.findOne({ where: { email: emailNormalizado } });
  if (emailJaExiste) {
    throw new Error("E-mail já cadastrado.");
  }
  usuario.email = emailNormalizado;

  // Valida e criptografa senha
  validarSenha(usuario.senha);
  const senhaCriptografada = await bcrypt.hash(usuario.senha, 10);
  usuario.senha = senhaCriptografada;

  const transaction = await sequelize.transaction();

  try {
    // Cria usuário
    const novoUsuario = await UsuarioModel.create(usuario, { transaction });

    // Recupera o ID corretamente
    const idUsuarioCriado = novoUsuario.getDataValue("idUsuario");

    if (!idUsuarioCriado) {
      throw new Error("ID do usuário não foi gerado após o cadastro.");
    }

    // Cria veículo se for motorista
    const veiculo = (usuario as any).veiculo as IVeiculo;

    if (usuario.tipoUsuario === "motorista" && veiculo) {
      await VeiculoModel.create(
        {
          Placa_veiculo: veiculo.Placa_veiculo,
          Cor: veiculo.Cor,
          Modelo: veiculo.Modelo,
          Ano: veiculo.Ano ? Number(veiculo.Ano) : null,
          idUsuario: idUsuarioCriado,
        },
        { transaction }
      );
    }

    await transaction.commit();

    // Envia boas-vindas (assíncrono)
    (async () => {
      try {
        await enviarEmailBoasVindas(novoUsuario.email, novoUsuario.nome);
      } catch (e) {
        console.error("[email boas-vindas] falhou:", e);
      }
    })();

    return { id: idUsuarioCriado };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Filtrar usuários
export const filtrarUsuarios = async (filtros: IusuarioFiltros): Promise<Iusuario[]> => {
  const usuarios = await UsuarioModel.findAll({
    where: {
      ...(filtros.nome && { nome: filtros.nome }),
      ...(filtros.email && { email: filtros.email }),
      ...(filtros.tipoUsuario && { tipoUsuario: filtros.tipoUsuario }),
    },
  });

  await Promise.all(
    usuarios.map(async (usuario) => {
      const fotoUrl = await getFotoByUsuarioId(usuario.idUsuario);
      usuario.setDataValue("fotoUrl", fotoUrl);
    })
  );

  return usuarios;
};

// Login de usuário com Log de Acesso
export const loginUsuario = async (req: Request, res: Response) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "E-mail e senha são obrigatórios" });
  }

  try {
    const usuario = await UsuarioModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const idUsuario = usuario.getDataValue("idUsuario");
    const nome = usuario.getDataValue("nome");
    const tipoUsuario = usuario.getDataValue("tipoUsuario");
    const senhaHash = usuario.getDataValue("senha");

    if (!idUsuario) {
      return res.status(500).json({ erro: "ID do usuário não encontrado" });
    }

    if (!senhaHash) {
      return res.status(500).json({ erro: "Senha não encontrada para o usuário" });
    }

    const senhaValida = await bcrypt.compare(senha, senhaHash);

    if (!senhaValida) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const veiculo = await VeiculoModel.findOne({
      where: { idUsuario },
    });

    const fotoUrlMongoS3 = await getFotoByUsuarioId(idUsuario);
    const cnhFotoUrlMongoS3 = await getFotoCnhByUsuarioId(idUsuario);

    const token = jwt.sign(
      {
        id: idUsuario,
        nome,
        tipoUsuario,
      },
      process.env.JWT_SECRET || "secretoo123",
      { expiresIn: "1d" }
    );

    await LogAcessoModel.create({
      idUsuario,
      dataAcesso: new Date(),
      tipoUsuario,
    });

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: idUsuario,
        nome,
        cpf: usuario.getDataValue("cpf"),
        email: usuario.getDataValue("email"),
        telefone: usuario.getDataValue("telefone"),
        cep: usuario.getDataValue("cep"),
        endereco: usuario.getDataValue("endereco"),
        numero: usuario.getDataValue("numero"),
        cidade: usuario.getDataValue("cidade"),
        estado: usuario.getDataValue("estado"),
        fatec: usuario.getDataValue("fatec"),
        ra: usuario.getDataValue("ra"),
        genero: usuario.getDataValue("genero"),
        dataNascimento: usuario.getDataValue("dataNascimento"),
        tipoUsuario,
        cnh: usuario.getDataValue("cnh") ?? null,
        fotoUrl: fotoUrlMongoS3 || usuario.getDataValue("fotoUrl") || null,
        fotoPath: usuario.getDataValue("fotoPath") ?? null,
        cnhFotoUrl: cnhFotoUrlMongoS3 || usuario.getDataValue("cnhFotoUrl") || null,
        cnhFotoPath: usuario.getDataValue("cnhFotoPath") ?? null,
        veiculo: veiculo ? veiculo.toJSON() : null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      erro: error.message || "Erro interno ao fazer login",
    });
  }
};

// Buscar usuário por ID
export const buscarUsuarioPorId = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  let fotoUrl: string | null = "";
  let cnhFotoUrl: string | null = "";

  try {
    const usuario = await UsuarioModel.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const veiculo = await VeiculoModel.findOne({
      where: { idUsuario: usuario.idUsuario },
    });

    fotoUrl = await getFotoByUsuarioId(usuario.idUsuario);
    cnhFotoUrl = await getFotoCnhByUsuarioId(usuario.idUsuario);

    return res.status(200).json({
      id: usuario.idUsuario,
      nome: usuario.nome,
      cpf: usuario.cpf,
      email: usuario.email,
      telefone: usuario.telefone,
      cep: usuario.cep,
      endereco: usuario.endereco,
      numero: usuario.numero,
      cidade: usuario.cidade,
      estado: usuario.estado,
      fatec: usuario.fatec,
      ra: usuario.ra,
      genero: usuario.genero,
      dataNascimento: usuario.dataNascimento,
      tipoUsuario: usuario.tipoUsuario,
      cnh: usuario.cnh ?? null,
      fotoUrl: fotoUrl || usuario.fotoUrl || null,
      fotoPath: usuario.fotoPath ?? null,
      cnhFotoUrl: cnhFotoUrl || usuario.cnhFotoUrl || null,
      cnhFotoPath: usuario.cnhFotoPath ?? null,
      veiculo: veiculo ? veiculo.toJSON() : null,
    });
  } catch (error: any) {
    return res.status(500).json({
      erro: error.message || "Erro ao buscar usuário",
    });
  }
};

// Atualizar dados do usuário
export const atualizarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dados = req.body as Iusuario;

  try {
    const usuario = await UsuarioModel.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    await usuario.update(dados);

    return res.status(200).json({ mensagem: "Usuário atualizado com sucesso" });
  } catch (error: any) {
    return res.status(500).json({
      erro: error.message || "Erro ao atualizar usuário",
    });
  }
};

// Deletar usuário e seus veículos
export const deletarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const usuario = await UsuarioModel.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    await VeiculoModel.destroy({ where: { idUsuario: id } });
    await usuario.destroy();

    return res.status(200).json({ mensagem: "Usuário deletado com sucesso" });
  } catch (error: any) {
    return res.status(500).json({
      erro: error.message || "Erro ao deletar usuário",
    });
  }
};

// FotoUrl/FotoPath
export const atualizarFotoUsuario = async (req: Request, res: Response) => {
  try {
    const { fotoUrl, fotoPath } = req.body || {};

    if (!fotoUrl && !fotoPath) {
      return res.status(400).json({ erro: "Envie pelo menos fotoUrl ou fotoPath" });
    }

    const userCtx = (req as any).user;
    const idUsuarioAutenticado: number | undefined = userCtx?.id ?? userCtx?.idUsuario;

    if (!idUsuarioAutenticado) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const usuario = await UsuarioModel.findByPk(idUsuarioAutenticado);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    await usuario.update({
      ...(typeof fotoUrl !== "undefined" ? { fotoUrl } : {}),
      ...(typeof fotoPath !== "undefined" ? { fotoPath } : {}),
    });

    return res.status(200).json({ mensagem: "Foto atualizada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao atualizar foto do usuário:", error);
    return res.status(500).json({ erro: error.message || "Erro ao atualizar foto" });
  }
};

// CnhUrl/CnhPath
export const atualizarFotoCnhUsuario = async (req: Request, res: Response) => {
  try {
    const { cnhFotoUrl, cnhFotoPath } = req.body || {};

    if (!cnhFotoUrl && !cnhFotoPath) {
      return res.status(400).json({
        erro: "Envie pelo menos cnhFotoUrl ou cnhFotoPath",
      });
    }

    const userCtx = (req as any).user;
    const idUsuarioAutenticado: number | undefined =
      userCtx?.id ?? userCtx?.idUsuario;

    if (!idUsuarioAutenticado) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const usuario = await UsuarioModel.findByPk(idUsuarioAutenticado);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    if (usuario.tipoUsuario !== "motorista") {
      return res.status(403).json({
        erro: "Apenas motoristas podem atualizar foto da CNH",
      });
    }

    await usuario.update({
      ...(typeof cnhFotoUrl !== "undefined" ? { cnhFotoUrl } : {}),
      ...(typeof cnhFotoPath !== "undefined" ? { cnhFotoPath } : {}),
    });

    return res.status(200).json({
      mensagem: "Foto da CNH atualizada com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao atualizar foto da CNH:", error);

    return res.status(500).json({
      erro: error.message || "Erro ao atualizar foto da CNH",
    });
  }
};

// Upload de foto (multipart 'file')
export const cadastrarFotoUsuario = async (req: Request, res: Response) => {
  try {
    const userCtx = (req as any).user;
    const idUsuario: number | undefined = userCtx?.id ?? userCtx?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const file = (req as any).file as {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    } | undefined;

    if (!file) {
      return res.status(400).json({ erro: "Envie um arquivo em 'file' (multipart/form-data)" });
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return res.status(400).json({
        erro: "Formato inválido. Envie uma imagem JPG, PNG ou WEBP.",
      });
    }

    const aws = await uploadArquivoS3(req.file!);
    if (!aws) {
      return res.status(500).json({ erro: "Falha ao enviar arquivo para AWS S3" });
    }

    const s3Inserted = await insertS3(idUsuario, aws.ETag!, file.mimetype);
    if (!s3Inserted) {
      return res.status(500).json({ erro: "Falha ao salvar informações no MongoDB" });
    }

    const fotoUrl = `https://faculride01.s3.us-east-1.amazonaws.com/${aws.Key}`;
    const fotoPath = aws.Key;

    const usuario = await UsuarioModel.findByPk(idUsuario);
    if (usuario) {
      await usuario.update({
        fotoUrl,
        fotoPath,
      });
    }

    console.log("Upload AWS S3 concluído:", s3Inserted);

    return res.status(200).json({
      mensagem: "Foto enviada e usuário atualizado com sucesso",
      url: fotoUrl,
      fotoUrl,
      fotoPath,
    });
  } catch (error: any) {
    console.error("uploadFotoUsuario:", error);
    return res.status(500).json({ erro: error.message || "Erro ao enviar foto" });
  }
};

// Upload de foto da CNH (multipart 'file')
export const cadastrarFotoCnhUsuario = async (req: Request, res: Response) => {
  try {
    const userCtx = (req as any).user;
    const idUsuario: number | undefined = userCtx?.id ?? userCtx?.idUsuario;

    if (!idUsuario) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const usuario = await UsuarioModel.findByPk(idUsuario);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    if (usuario.tipoUsuario !== "motorista") {
      return res.status(403).json({
        erro: "Apenas motoristas podem enviar foto da CNH",
      });
    }

    const file = (req as any).file as {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname: string;
    } | undefined;

    if (!file) {
      return res.status(400).json({
        erro: "Envie um arquivo em 'file' (multipart/form-data)",
      });
    }

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return res.status(400).json({
        erro: "Formato inválido. Envie JPG, PNG, WEBP ou PDF.",
      });
    }

    const aws = await uploadArquivoS3(req.file!);

    if (!aws) {
      return res.status(500).json({
        erro: "Falha ao enviar arquivo para AWS S3",
      });
    }

    const s3Inserted = await insertS3(
      idUsuario,
      aws.ETag!,
      `CNH-${file.mimetype}`
    );

    if (!s3Inserted) {
      return res.status(500).json({
        erro: "Falha ao salvar informações da CNH no MongoDB",
      });
    }

    const cnhFotoUrl = `https://faculride01.s3.us-east-1.amazonaws.com/${aws.Key}`;
    const cnhFotoPath = aws.Key;

    await usuario.update({
      cnhFotoUrl,
      cnhFotoPath,
    });

    return res.status(200).json({
      mensagem: "Foto da CNH enviada com sucesso",
      url: cnhFotoUrl,
      cnhFotoUrl,
      cnhFotoPath,
    });
  } catch (error: any) {
    console.error("cadastrarFotoCnhUsuario:", error);

    return res.status(500).json({
      erro: error.message || "Erro ao enviar foto da CNH",
    });
  }
};

const getFotoByUsuarioId = async (idUsuario: number): Promise<string | null> => {
  const s3Object =
    await findS3ById(idUsuario, "image/jpeg") ||
    await findS3ById(idUsuario, "image/png") ||
    await findS3ById(idUsuario, "image/webp");

  let fotoUrl: string | null = "";

  if (s3Object) {
    const fileS3 = await getArquivoS3byID(s3Object.etag);
    if (fileS3) {
      fotoUrl = `https://faculride01.s3.us-east-1.amazonaws.com/${fileS3.Key}`;
    } else {
      fotoUrl = null;
    }
  }

  return fotoUrl;
};

const getFotoCnhByUsuarioId = async (idUsuario: number): Promise<string | null> => {
  const s3Object =
    await findS3ById(idUsuario, "CNH-image/jpeg") ||
    await findS3ById(idUsuario, "CNH-image/png") ||
    await findS3ById(idUsuario, "CNH-image/webp") ||
    await findS3ById(idUsuario, "CNH-application/pdf");

  let cnhFotoUrl: string | null = "";

  if (s3Object) {
    const fileS3 = await getArquivoS3byID(s3Object.etag);

    if (fileS3) {
      cnhFotoUrl = `https://faculride01.s3.us-east-1.amazonaws.com/${fileS3.Key}`;
    } else {
      cnhFotoUrl = null;
    }
  }

  return cnhFotoUrl;
};

// Alterar senha do usuário autenticado
export const alterarSenha = async (req: Request, res: Response) => {
  try {
    const userCtx = (req as any).user;
    const idUsuario = userCtx?.id ?? userCtx?.idUsuario;

    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    if (!idUsuario) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      return res.status(400).json({
        erro: "Preencha senhaAtual, novaSenha e confirmarSenha",
      });
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({
        erro: "Confirmação de senha não confere",
      });
    }

    const usuario = await UsuarioModel.findByPk(idUsuario);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: "Senha atual incorreta" });
    }

    validarSenha(novaSenha);

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await usuario.update({ senha: novaSenhaHash });

    return res.status(200).json({
      mensagem: "Senha alterada com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao alterar senha:", error);
    return res.status(500).json({
      erro: error.message || "Erro ao alterar senha",
    });
  }
};