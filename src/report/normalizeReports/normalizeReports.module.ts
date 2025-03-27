import { Module } from '@nestjs/common';
import { NormalizeReportsService } from './normalizeReports.service';
import { NormalizeTradesService } from 'src/report/normalizeTrades/normalizeTrades.service';

@Module({
  providers: [NormalizeReportsService, NormalizeTradesService],
})
export class NormalizeReportsModule {}
