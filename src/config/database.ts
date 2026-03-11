import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const url =
  process.env.NODE_ENV === "dev"
    ? "postgres://postgres:1234@localhost:5432/faculride"
    : process.env.DATABASE_URL!;

const sequelize = new Sequelize(url, {
  dialect: "postgres",
  dialectModule: pg,
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

export default sequelize;




