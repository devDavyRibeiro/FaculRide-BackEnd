import { Request, Response } from "express";
import { VeiculoModel } from "../models/veiculo.model";
import { IVeiculo } from "../interfaces/Iveiculo";

// Listar todos os veículos
export const listarTodos = async (req: Request, res: Response) => {
  try {
    const veiculos = await VeiculoModel.findAll();
    return res.status(200).json(veiculos);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message || "Erro ao buscar veículos" });
  }
};

// Listar veículo por usuário
export const listarPorUsuario = async (req: Request, res: Response) => {
  const { idUsuario } = req.params;

  try {
    const veiculo = await VeiculoModel.findOne({ where: { idUsuario: Number(idUsuario) } });

    if (!veiculo) {
      return res.status(404).json({ erro: "Nenhum veículo cadastrado para este usuário" });
    }

    return res.status(200).json(veiculo);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message || "Erro ao buscar veículo" });
  }
};

// Criar veículo
export const criarVeiculo = async (req: Request, res: Response) => {
  const dados = req.body as IVeiculo;

  try {
    if (!dados.idUsuario) {
      return res.status(400).json({ erro: "idUsuario é obrigatório para criar veículo" });
    }

    const novoVeiculo = await VeiculoModel.create({
      Placa_veiculo: dados.Placa_veiculo,
      Cor: dados.Cor,
      Modelo: dados.Modelo,
      Ano: dados.Ano ? Number(dados.Ano) : null,
      idUsuario: dados.idUsuario
    });

    return res.status(201).json(novoVeiculo);
  } catch (error: any) {
    return res.status(400).json({ erro: error.message || "Erro ao criar veículo" });
  }
};

// Atualizar veículo
export const atualizarVeiculo = async (req: Request, res: Response) => {
  const { id } = req.params;
  const dados = req.body as IVeiculo;

  try {
    const veiculo = await VeiculoModel.findByPk(Number(id));

    if (!veiculo) {
      return res.status(404).json({ erro: "Veículo não encontrado com este ID" });
    }

    await veiculo.update({
      Placa_veiculo: dados.Placa_veiculo,
      Cor: dados.Cor,
      Modelo: dados.Modelo,
      Ano: dados.Ano ? Number(dados.Ano) : null,
      idUsuario: dados.idUsuario
    });

    return res.status(200).json({ mensagem: "Veículo atualizado com sucesso", veiculo });
  } catch (error: any) {
    return res.status(500).json({ erro: error.message || "Erro ao atualizar veículo" });
  }
};

// Deletar veículo
export const deletarVeiculo = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const veiculo = await VeiculoModel.findByPk(Number(id));

    if (!veiculo) {
      return res.status(404).json({ erro: "Veículo não encontrado para este ID" });
    }

    await veiculo.destroy();

    return res.status(200).json({ mensagem: "Veículo deletado com sucesso" });
  } catch (error: any) {
    return res.status(500).json({ erro: error.message || "Erro ao deletar veículo" });
  }
};
