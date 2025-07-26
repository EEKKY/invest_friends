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

export enum Social {
  KAKAO = 'kakao',
  GOOGLE = 'google',
  NAVER = 'naver',
}

export enum Assist {
  ASSIST_1 = 'assist_1',
  ASSIST_2 = 'assist_2',
  ASSIST_3 = 'assist_3',
  ASSIST_4 = 'assist_4',
  ASSIST_5 = 'assist_5',
  ASSIST_6 = 'assist_6',
  ASSIST_7 = 'assist_7',
}

@Entity()
export class AuthEntity {
  @PrimaryGeneratedColumn()
  userId: number;

  @Index()
  @Column({ unique: true })
  userUid: string;

  @Column({ nullable: true })
  userPassword: string;

  @Index()
  @Column({ unique: true })
  userEmail: string;

  @Column({ unique: true })
  userNick: string;

  @Column({ type: 'enum', enum: Social, nullable: true })
  social: Social | null;

  @Column({ type: 'enum', enum: Assist, nullable: true })
  assist: Assist | null;

  @CreateDateColumn()
  createAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @DeleteDateColumn()
  deleteAt: Date | null;

  @BeforeInsert()
  generateUid(): void {
    this.userUid = randomUUID();
  }
}
