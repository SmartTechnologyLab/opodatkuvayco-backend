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
import { IsEmail, IsNotEmpty } from 'class-validator';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  @Column({ unique: true })
  email: string;

  @ApiProperty({ enum: Providers, enumName: 'Providers' })
  @Column({
    type: 'simple-array',
  })
  providers: Providers[];

  @Column()
  password: string;

  @Column()
  confirmationToken: string;

  @ApiProperty()
  @Column({ type: 'boolean' })
  emailConfirmed: boolean;

  @Column()
  twoFactorAuthentificationSecret: string;

  @ApiProperty()
  @Column({ type: 'boolean' })
  twoFactorAuthentificationEnabled: boolean;

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
