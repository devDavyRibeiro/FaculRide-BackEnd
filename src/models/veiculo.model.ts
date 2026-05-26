import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { IVeiculo } from "../interfaces/Iveiculo";

type VeiculoCreationAttributes = Optional<IVeiculo, "ID_veiculo">;

export class VeiculoModel extends Model<IVeiculo, VeiculoCreationAttributes> {
  declare ID_veiculo: number;
  declare Placa_veiculo?: string;
  declare Cor: string;
  declare Modelo: string;
  declare Ano?: number;
  declare idUsuario: number;
}

VeiculoModel.init({
  ID_veiculo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    field: "ID_veiculo"
  },
  Placa_veiculo: {
    type: DataTypes.STRING(8),
    allowNull: true,
    field: "Placa_veiculo"
  },
  Cor: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: "Cor"
  },
  Modelo: {
    type: DataTypes.STRING(15),
    allowNull: false,
    field: "Modelo"
  },
  Ano: { 
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "Ano"
  },
  idUsuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "idUsuario"
  }
}, {
  sequelize,
  tableName: "veiculo",
  timestamps: false
});
