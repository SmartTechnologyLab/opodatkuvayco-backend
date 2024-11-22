import { ApiProperty } from '@nestjs/swagger';
import { Deal } from 'src/deals/entities/deals.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DealReport } from '../types/interfaces/deal-report.interface';

@Entity()
export class Report implements DealReport<Deal> {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  totalMilitaryFee: number;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  total: number;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  totalTaxFee: number;

  @ApiProperty({ type: () => Deal })
  @OneToMany(() => Deal, (deal) => deal.report, { cascade: true })
  @JoinColumn()
  deals: Deal[];

  @ManyToOne(() => User, { nullable: true })
  user: User;
}
