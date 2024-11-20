import { ApiProperty } from '@nestjs/swagger';
import { Report } from 'src/report/entities/report.entity';
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
export class Trade {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @ApiProperty()
  @Column('date')
  date: Date;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  sum: number;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  commission: number;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  rate: number;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  uah: number;
}

@Entity({ name: 'deals' })
export class Deal {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  percent: number;

  @ApiProperty()
  @Column()
  quantity: number;

  @ApiProperty()
  @Column()
  ticker: string;

  @ApiProperty()
  @Column({ type: 'double', precision: 10, scale: 2 })
  total: number;

  @ApiProperty({ type: () => Trade })
  @OneToOne(() => Trade, { cascade: true })
  @JoinColumn()
  purchase: Trade;

  @ApiProperty({ type: () => Trade })
  @OneToOne(() => Trade, { cascade: true })
  @JoinColumn()
  sale: Trade;

  @ManyToOne(() => Report, (report) => report.deals, { onDelete: 'CASCADE' })
  report: Report;

  @ManyToOne(() => User, (report) => report)
  @JoinColumn()
  user: User;
}
