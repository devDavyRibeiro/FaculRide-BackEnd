import { Iusuario } from "../interfaces/Iusuario";
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

type UsuarioCreationalAttributes = Optional<
  Iusuario,
  "idUsuario" | "cnh" | "fotoUrl" | "fotoPath" | "cnhFotoUrl" | "cnhFotoPath"
>;

export class UsuarioModel extends Model<Iusuario, UsuarioCreationalAttributes> {
  declare idUsuario: number;
  declare nome: string;
  declare cpf: string;
  declare ra: string;
  declare dataNascimento: Date;
  declare genero: boolean;
  declare cep: string;
  declare endereco: string;
  declare numero: string;
  declare cidade: string;
  declare estado: string;
  declare email: string;
  declare telefone: string;
  declare senha: string;
  declare tipoUsuario: "passageiro" | "motorista";
  declare cnh?: string;
  declare fatec: string;
  declare fotoUrl?: string | null;
  declare fotoPath?: string | null;
  declare cnhFotoUrl?: string | null;
  declare cnhFotoPath?: string | null;
}

UsuarioModel.init(
  {
    idUsuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    cpf: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: true,
        len: [11, 11],
      },
    },

    ra: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: true,
        len: [13, 13],
      },
    },

    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    genero: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    cep: {
      type: DataTypes.STRING(9),
      allowNull: false,
    },
    endereco: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    numero: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    cidade: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },

    telefone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    senha: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tipoUsuario: {
      type: DataTypes.ENUM("passageiro", "motorista"),
      allowNull: false,
    },
    cnh: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    fatec: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    fotoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL pública da foto do usuário",
    },
    fotoPath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Path do arquivo no Supabase Storage",
    },

    cnhFotoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "URL pública da foto da CNH",
    },

    cnhFotoPath: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Path da foto da CNH no Storage",
    },
  },
  {
    sequelize,
    tableName: "usuario",
    timestamps: false,
  }
);
