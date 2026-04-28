import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { IViajemAgendada } from "../interfaces/IViajemAgendada";

type ViajemAgendadaCreationAttributes = Optional<IViajemAgendada, "idAgendamento" | "createdAt" | "updatedAt">;

export class ViajemAgendadaModel
  extends Model<IViajemAgendada, ViajemAgendadaCreationAttributes>
  implements IViajemAgendada
{
  public idAgendamento!: number;
  public idViagem!: number;
  public data!: string;
  public createdAt?: Date;
  public updatedAt?: Date;
}

ViajemAgendadaModel.init(
  {
    idAgendamento: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    idViagem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "viagem",
        key: "idViagem",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    data: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "viajem_agendada",
    timestamps: true, 
  }
);
