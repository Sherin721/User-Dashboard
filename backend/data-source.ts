import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config(); // load env variables first

import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Vehicle } from "./entity/Vehicle";  
import { Group } from "./entity/Group";     

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "testdb",
  synchronize: false,  // use false because table already exists
  logging: false,
  entities: [User, Vehicle, Group],
});
