import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { NormalizeTradesService } from 'src/report/normalizeTrades/normalizeTrades.service';
import { NormalizeReportsService } from 'src/report/normalizeReports/normalizeReports.service';
import { DealsModule } from 'src/deals/deals.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportRepositoryService } from './reportRepository.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), DealsModule],
  controllers: [ReportController],
  providers: [
    ReportService,
    NormalizeTradesService,
    NormalizeReportsService,
    ReportRepositoryService,
  ],
})
export class ReportModule {}
