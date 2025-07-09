import { randomUUID } from "crypto";
import { BeforeInsert, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AuthEntity {
@PrimaryGeneratedColumn({ name: 'user_id'})
userId: number;

@Index()
@Column({ name: 'user_uid', unique: true })
userUid: string;

@Column({ name: 'user_password' })
userPassword: string;

@Column({ name: 'user_email', unique: true })
userEmail: string;

@Column({ name: 'user_nick', unique: true })
userNick: string;

@BeforeInsert()
generateUid() {
this.userUid = randomUUID();
}
}
