import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface IConversaCarona {
  idConversa: number;
  idViagem: number;
  idMotorista: number;
  idPassageiro: number;
  status: string;
  aceiteMotorista: boolean;
  aceitePassageiro: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type ConversaCreationAttributes = Optional<
  IConversaCarona,
  "idConversa" | "status" | "aceiteMotorista" | "aceitePassageiro" | "createdAt" | "updatedAt"
>;

export class ConversaCaronaModel
  extends Model<IConversaCarona, ConversaCreationAttributes>
  implements IConversaCarona
{
  public idConversa!: number;
  public idViagem!: number;
  public idMotorista!: number;
  public idPassageiro!: number;
  public status!: string;
  public aceiteMotorista!: boolean;
  public aceitePassageiro!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ConversaCaronaModel.init(
  {
    idConversa: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    idViagem: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    idMotorista: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    idPassageiro: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pendente",
    },

    aceiteMotorista: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    aceitePassageiro: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "conversa_carona",
    timestamps: true,
  }
);