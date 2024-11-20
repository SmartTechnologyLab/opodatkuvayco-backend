import { Deal } from 'src/deals/entities/deals.entity';
import { Report } from 'src/report/entities/report.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Report, (report) => report.user, { cascade: true })
  reports: Report[];

  @OneToMany(() => Deal, (deal) => deal.user, { cascade: true })
  deals: Deal[];
}
