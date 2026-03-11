import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { Iviagem } from "../interfaces/Iviagem";

type ViagemCreationAttributes = Optional<Iviagem, "idViagem">;

export class ViagemModel extends Model<Iviagem, ViagemCreationAttributes> implements Iviagem {
  public idViagem!: number;
  public tipoUsuario!: string;
  public partida!: string;
  public destino!: string;
  public horarioEntrada!: string;
  public horarioSaida!: string;
  public ajudaDeCusto!: string;
  public idUsuario!: number;
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
    }
  },
  {
    sequelize,
    tableName: "viagem",
    timestamps: false,
  }
);