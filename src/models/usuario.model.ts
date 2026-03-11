import { Iusuario } from "../interfaces/Iusuario";
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

type UsuarioCreationalAttributes = Optional<Iusuario, "idUsuario" | "cnh" | "fotoUrl" | "fotoPath">;

export class UsuarioModel extends Model<Iusuario, UsuarioCreationalAttributes> {
  public idUsuario!: number;
  public nome!: string;
  public cpf!: string;
  public ra!: string;
  public dataNascimento!: Date;
  public genero!: boolean;
  public cep!: string;
  public endereco!: string;
  public numero!: string;
  public cidade!: string;
  public estado!: string;
  public email!: string;
  public telefone!: string;
  public senha!: string;
  public tipoUsuario!: "passageiro" | "motorista";
  public cnh?: string;
  public fatec!: string;
  public fotoUrl?: string | null;
  public fotoPath?: string | null;
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
  },
  {
    sequelize,
    tableName: "usuario",
    timestamps: false,
  }
);
