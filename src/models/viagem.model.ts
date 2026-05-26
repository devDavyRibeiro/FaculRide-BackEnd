import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { Iviagem } from "../interfaces/Iviagem";

type ViagemCreationAttributes = Optional<Iviagem, "idViagem">;

export class ViagemModel extends Model<Iviagem, ViagemCreationAttributes> implements Iviagem {
  declare idViagem: number;
  declare tipoUsuario: string;
  declare partida: string;
  declare destino: string;
  declare horarioEntrada: string;
  declare horarioSaida: string;
  declare ajudaDeCusto: string;
  declare idUsuario: number;
  declare cancelada: boolean;
  declare canceladaPor: number | null;
  declare dataCancelamento: Date | null;
}

ViagemModel.init(
  {
    idViagem: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    tipoUsuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    partida: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    destino: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    horarioEntrada: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    horarioSaida: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ajudaDeCusto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuario',
        key: 'idUsuario'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },

    cancelada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    canceladaPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuario',
        key: 'idUsuario'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    dataCancelamento: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: "viagem",
    timestamps: false,
  }
);