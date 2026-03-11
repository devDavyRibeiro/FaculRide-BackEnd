import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { IAvaliacao } from "../interfaces/Iavaliacao";

type AvaliacaoCreationAttributes = Optional<IAvaliacao, "ID_Avaliacao">;

export class AvaliacaoModel extends Model<IAvaliacao, AvaliacaoCreationAttributes> implements IAvaliacao {
  public ID_Avaliacao!: number;
  public ID_Avaliador!: number;
  public ID_Avaliado!: number;
  public Comentario!: string;
  public Estrelas!: number;
}

AvaliacaoModel.init(
  {
    ID_Avaliacao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: "ID_Avaliacao"
    },
    ID_Avaliador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_Avaliador",
      references: {
        model: 'usuario',   
        key: 'idUsuario'    
      }
    },
    ID_Avaliado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "ID_Avaliado",
      references: {
        model: 'usuario',   
        key: 'idUsuario'    
      }
    },
    Comentario: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "Comentario"
    },
    Estrelas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "Estrelas"
    }
  },
  {
    sequelize,
    tableName: "Avaliacao",
    timestamps: false
  }
);
