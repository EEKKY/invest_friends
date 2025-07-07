import { randomUUID } from "crypto";
import { BeforeInsert, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AuthEntity {
@PrimaryGeneratedColumn()
id: number;

@Index()
@Column({ unique: true })
uid: string;

@Column()
password: string;

@Column({ unique: true })
email: string;

@Column({ unique: true })
nick: string;

@BeforeInsert()
generateUid() {
this.uid = randomUUID();
}
}
