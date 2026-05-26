import { ILogAcesso } from "../interfaces/ILogAcesso";
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

type LogAcessoCreationAttributes = Optional<ILogAcesso, "idLogAcesso">;

export class LogAcessoModel extends Model<ILogAcesso, LogAcessoCreationAttributes> implements ILogAcesso {
  declare idLogAcesso: number;
  declare idUsuario: number;
  declare dataAcesso: Date;
  declare tipoUsuario: "passageiro" | "motorista";
}

LogAcessoModel.init(
  {
    idLogAcesso: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: "idLogAcesso"
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuario",
        key: "idUsuario"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      field: "idUsuario"
    },
    dataAcesso: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "dataAcesso"
    },
    tipoUsuario: {
      type: DataTypes.ENUM("passageiro", "motorista"),
      allowNull: false,
      field: "tipoUsuario"
    }
  },
  {
    sequelize,
    tableName: "logAcesso",
    timestamps: false
  }
);
