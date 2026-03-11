import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { enviarEmailBoasVindas } from "../utils/email";
dotenv.config();

import { UsuarioModel } from "../models/usuario.model";
import { VeiculoModel } from "../models/veiculo.model";
import { LogAcessoModel } from "../models/logAcesso.model";
import { Iusuario, IRetornoCadastroUsuario, IusuarioFiltros } from "../interfaces/Iusuario";
import { IVeiculo } from "../interfaces/Iveiculo";
import { supabaseAdmin } from "../config/supabase";

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

  // Cria usuário
  const novoUsuario = await UsuarioModel.create(usuario);

  // Cria veículo se for motorista
  const veiculo = (usuario as any).veiculo as IVeiculo;
  if (usuario.tipoUsuario === "motorista" && veiculo) {
    await VeiculoModel.create({
      ...veiculo,
      idUsuario: novoUsuario.idUsuario,
    });
  }

  // Envia boas-vindas (assíncrono)
  (async () => {
    try {
      await enviarEmailBoasVindas(novoUsuario.email, novoUsuario.nome);
    } catch (e) {
      console.error("[email boas-vindas] falhou:", e);
    }
  })();

  return { id: novoUsuario.idUsuario };
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

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const veiculo = await VeiculoModel.findOne({
      where: { idUsuario: usuario.idUsuario },
    });

    const token = jwt.sign(
      {
        id: usuario.idUsuario,
        nome: usuario.nome,
        tipoUsuario: usuario.tipoUsuario,
      },
      process.env.JWT_SECRET || "secretoo123",
      { expiresIn: "1d" }
    );

    // Cria log de acesso automaticamente no login
    await LogAcessoModel.create({
      idUsuario: usuario.idUsuario,
      dataAcesso: new Date(),
      tipoUsuario: usuario.tipoUsuario,
    });

    return res.status(200).json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
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
        fotoUrl: usuario.fotoUrl ?? null,
        fotoPath: usuario.fotoPath ?? null,
        veiculo: veiculo ? veiculo.toJSON() : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      erro: error.message || "Erro interno ao fazer login",
    });
  }
};

// Buscar usuário por ID
export const buscarUsuarioPorId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const usuario = await UsuarioModel.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    const veiculo = await VeiculoModel.findOne({
      where: { idUsuario: usuario.idUsuario },
    });

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
      fotoUrl: usuario.fotoUrl ?? null,
      fotoPath: usuario.fotoPath ?? null,
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
  const { id } = req.params;
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
  const { id } = req.params;

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

    // Obtém o usuário autenticado do middleware (id ou idUsuario)
    const userCtx = (req as any).user;
    const idUsuarioAutenticado: number | undefined = userCtx?.id ?? userCtx?.idUsuario;

    if (!idUsuarioAutenticado) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const usuario = await UsuarioModel.findByPk(idUsuarioAutenticado);
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    // Atualiza SOMENTE os campos novos
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

// Upload de foto (multipart 'file')
export const uploadFotoUsuario = async (req: Request, res: Response) => {
  try {
    const userCtx = (req as any).user;
    const idUsuario: number | undefined = userCtx?.id ?? userCtx?.idUsuario;
    if (!idUsuario) {
      return res.status(401).json({ erro: "Usuário não autenticado" });
    }

    const file = (req as any).file as { buffer: Buffer; mimetype: string; size: number; originalname: string } | undefined;
    if (!file) {
      return res.status(400).json({ erro: "Envie um arquivo em 'file' (multipart/form-data)" });
    }

    const mime = file.mimetype;
    const allow = ["image/jpeg", "image/png", "image/webp"];
    if (!allow.includes(mime)) {
      return res.status(400).json({ erro: "Tipo inválido. Use JPEG, PNG ou WEBP." });
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      return res.status(400).json({ erro: "Arquivo muito grande (máx. 5MB)." });
    }

    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    const bucket = process.env.SUPABASE_BUCKET || "faculride";
    const filePath = `${idUsuario}/profile.${ext}`;

    const { error: upErr } = await supabaseAdmin
      .storage.from(bucket)
      .upload(filePath, file.buffer, { contentType: mime, upsert: true });

    if (upErr) {
      console.error("Erro no upload Supabase:", upErr);
      return res.status(500).json({ erro: "Falha ao enviar arquivo ao Storage" });
    }

    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
    const fotoUrl = pub?.publicUrl ?? null;

    const usuario = await UsuarioModel.findByPk(idUsuario);
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

    await usuario.update({ fotoUrl, fotoPath: filePath });

    return res.status(200).json({
      mensagem: "Foto enviada e usuário atualizado com sucesso",
      fotoUrl,
      fotoPath: filePath
    });
  } catch (error: any) {
    console.error("uploadFotoUsuario:", error);
    return res.status(500).json({ erro: error.message || "Erro ao enviar foto" });
  }
};
