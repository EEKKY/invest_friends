import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('corp_code')
export class CorpCode {
  @PrimaryColumn()
  corp_code: number;

  @Column()
  corp_name: string;

  @Column({ nullable: true })
  corp_eng_name: string;

  @Column({ nullable: true })
  stock_code: string;

  @Column()
  modify_date: number;
}
