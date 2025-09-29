import "reflect-metadata";
import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "testdb",
  synchronize: false, // important: don't overwrite schema
  logging: false,
  entities: [User],
});

async function hashAllPasswords() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find();

  for (const user of users) {
    if (user.password && !user.password.startsWith("$2a$")) {
      // Only hash if not already hashed
      const hashed = await bcrypt.hash(user.password, 10);
      user.password = hashed;
      await userRepo.save(user);
      console.log(`Hashed password for user: ${user.username}`);
    }
  }

  console.log("✅ All passwords hashed!");
  process.exit(0);
}

hashAllPasswords().catch(err => {
  console.error(err);
  process.exit(1);
});
