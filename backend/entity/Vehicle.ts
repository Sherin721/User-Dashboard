import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string;

  @Column({ nullable: true })
  color!: string;

  @Column({ nullable: true, type: "int" })
  wheels!: number;

  @ManyToOne(() => User, (user) => user.vehicles, { onDelete: "SET NULL" })
  user!: User | null;
}
