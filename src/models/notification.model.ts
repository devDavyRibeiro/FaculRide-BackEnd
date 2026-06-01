import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { INotification } from "../interfaces/INotification";

type CreationAttrs = Optional<INotification, "id" | "isRead" | "createdAt" | "updatedAt">;

export class NotificationModel
  extends Model<INotification, CreationAttrs>
  implements INotification
{
  declare id: number;
  declare userId: number;
  declare type: string;
  declare title: string;
  declare message: string;
  declare metadata?: any;
  declare isRead: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NotificationModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "Notification",
    timestamps: true,
  }
);
