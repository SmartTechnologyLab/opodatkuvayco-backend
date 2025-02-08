import { ApiProperty } from '@nestjs/swagger';
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
import { Providers } from '../constants/providers';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  username: string;

  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty()
  @Column({
    type: 'simple-array',
  })
  providers: Providers[];

  @Column()
  password: string;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Report, (report) => report.user, { cascade: true })
  reports: Report[];

  @OneToMany(() => Deal, (deal) => deal.user, { cascade: true })
  deals: Deal[];
}
