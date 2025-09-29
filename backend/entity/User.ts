import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from "typeorm";
import { Vehicle } from "./Vehicle";
import { Group } from "./Group";

@Entity({ name: '"user"' }) 
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: "user" })
  role!: string;

  @Column({ default: true })
  active!: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.user, { cascade: true })
  vehicles!: Vehicle[];

  @ManyToMany(() => Group, (group) => group.users, { cascade: true })
  @JoinTable()
  groups!: Group[];
}
