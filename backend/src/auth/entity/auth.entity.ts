import { randomUUID } from 'crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class AuthEntity {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Index()
  @Column({ name: 'user_uid', unique: true })
  userUid: string;

  @Column({ name: 'user_password' })
  userPassword: string;

  @Index()
  @Column({ name: 'user_email', unique: true })
  userEmail: string;

  @Column({ name: 'user_nick', unique: true })
  userNick: string;

  @CreateDateColumn({ name: 'create_at' })
  createAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updateAt: Date;

  @DeleteDateColumn({ name: 'delete_at' })
  deleteAt: Date | null;

  @BeforeInsert()
  generateUid(): void {
    this.userUid = randomUUID();
  }
}
