import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commission: number;

  @Column()
  date: Date;

  @Column()
  price: number;

  @Column()
  rate: number;

  @Column()
  sum: number;

  @Column()
  uah: number;
}

@Entity()
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column()
  ticker: string;

  @Column()
  total: number;

  @Column()
  percent: number;

  @OneToOne(() => Deal, { cascade: true })
  @JoinColumn()
  purchase: Deal;

  @OneToOne(() => Deal, { cascade: true })
  @JoinColumn()
  sale: Deal;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;
}
