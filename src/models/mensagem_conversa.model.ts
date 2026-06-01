import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface IMensagemConversa {
  idMensagem: number;
  idConversa: number;
  idRemetente: number;
  mensagem: string;
  lida: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

type MensagemCreationAttributes = Optional<
  IMensagemConversa,
  "idMensagem" | "lida" | "createdAt" | "updatedAt"
>;

export class MensagemConversaModel
  extends Model<IMensagemConversa, MensagemCreationAttributes>
  implements IMensagemConversa
{
  declare idMensagem: number;
  declare idConversa: number;
  declare idRemetente: number;
  declare mensagem: string;
  declare lida: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

MensagemConversaModel.init(
  {
    idMensagem: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    idConversa: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    idRemetente: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    mensagem: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    lida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "mensagem_conversa",
    timestamps: true,
  }
);