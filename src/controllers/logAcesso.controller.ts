import { ILogAcesso } from "../interfaces/ILogAcesso";
import { LogAcessoModel } from "../models/logAcesso.model";

// GET log de acesso
export const listAll = (): Promise<ILogAcesso[]> => {
  return LogAcessoModel.findAll();
};

// POST log de acesso
export const create = (dados: ILogAcesso): Promise<ILogAcesso> => {
  return LogAcessoModel.create(dados);
};

// PUT log de acesso
export const update = (id: number, dados: ILogAcesso): Promise<ILogAcesso | null> => {
  return LogAcessoModel.findByPk(id).then(log => {
    if (!log) return null;
    return log.update(dados);
  });
};

// DELETE log de acesso
export const remove = (id: number): Promise<boolean> => {
  return LogAcessoModel.findByPk(id).then(log => {
    if (!log) return false;
    return log.destroy().then(() => true);
  });
};
