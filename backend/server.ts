import "reflect-metadata";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { User } from "./entity/User";
import { Vehicle } from "./entity/Vehicle";
import { Group } from "./entity/Group";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "testdb",
  synchronize: false, // <- important! don't recreate tables
  logging: false,
  entities: [User, Vehicle, Group],
});

const app = express();
app.use(cors());
app.use(express.json());

// ---------------- User Routes ----------------
app.get("/api/users", async (_: Request, res: Response) => {
  const userRepo = AppDataSource.getRepository(User);
  const users = await userRepo.find({ relations: ["vehicles", "groups"] });
  res.json(users);
});

app.get("/api/users/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id }, relations: ["vehicles", "groups"] });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.post("/api/users", async (req: Request, res: Response) => {
  const { username, email, role, password } = req.body;
  if (!username || !email || !role || !password)
    return res.status(400).json({ message: "All fields required" });

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: [{ username }, { email }] });
  if (existing) return res.status(400).json({ message: "User/email exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = userRepo.create({
    username,
    email,
    role,
    password: hashedPassword,
    active: true,
  });
  await userRepo.save(newUser);
  res.json(newUser);
});

app.put("/api/users/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (req.body.password) {
    req.body.password = await bcrypt.hash(req.body.password, 10);
  }

  userRepo.merge(user, req.body);
  await userRepo.save(user);
  res.json(user);
});

app.patch("/api/users/:id/toggle-active", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOneBy({ id });
  if (!user) return res.status(404).json({ message: "User not found" });

  user.active = !user.active;
  await userRepo.save(user);
  res.json(user);
});

app.delete("/api/users/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const userRepo = AppDataSource.getRepository(User);
  await userRepo.delete(id);
  res.json({ message: "User deleted" });
});

// ---------------- Vehicle Routes ----------------
app.post("/api/vehicles", async (req: Request, res: Response) => {
  const { userId, type, color, wheels } = req.body;
  const userRepo = AppDataSource.getRepository(User);
  const vehicleRepo = AppDataSource.getRepository(Vehicle);

  const user = userId ? await userRepo.findOneBy({ id: userId }) : null;
  const vehicle = vehicleRepo.create({ type, color, wheels, user });
  await vehicleRepo.save(vehicle);
  res.json(vehicle);
});

app.get("/api/vehicles", async (_: Request, res: Response) => {
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const vehicles = await vehicleRepo.find({ relations: ["user"] });
  res.json(vehicles);
});

app.put("/api/vehicles/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  const vehicle = await vehicleRepo.findOne({ where: { id }, relations: ["user"] });
  if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

  if (req.body.userId) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOneBy({ id: Number(req.body.userId) });
    vehicle.user = user || null;
  }

  vehicleRepo.merge(vehicle, req.body);
  await vehicleRepo.save(vehicle);
  res.json(vehicle);
});

app.delete("/api/vehicles/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const vehicleRepo = AppDataSource.getRepository(Vehicle);
  await vehicleRepo.delete(id);
  res.json({ message: "Vehicle deleted" });
});

// ---------------- Group Routes ----------------
app.post("/api/groups", async (req: Request, res: Response) => {
  const { name, userIds } = req.body;
  const groupRepo = AppDataSource.getRepository(Group);
  const userRepo = AppDataSource.getRepository(User);

  const users = userIds && userIds.length
    ? await userRepo.findBy({ id: userIds })
    : [];
  const group = groupRepo.create({ name, users });
  await groupRepo.save(group);
  res.json(group);
});

app.get("/api/groups", async (_: Request, res: Response) => {
  const groupRepo = AppDataSource.getRepository(Group);
  const groups = await groupRepo.find({ relations: ["users"] });
  res.json(groups);
});

// ---------------- Login Route ----------------
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and password are required" });
    }

    const userRepo = AppDataSource.getRepository(User);

    // Find user by username
    const user = await userRepo.findOneBy({ username });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Compare passwords
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid username or password" });
    }

    // Check if user is active
    if (!user.active) {
      return res
        .status(403)
        .json({ success: false, message: "User is inactive" });
    }

    // Success
    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- Initialize ----------------
AppDataSource.initialize()
  .then(() => {
    console.log("📦 Data Source initialized!");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
  })
  .catch((err) => console.error("❌ Data Source error:", err));
