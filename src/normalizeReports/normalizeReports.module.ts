import { Module } from '@nestjs/common';
import { NormalizeReportsService } from './normalizeReports.service';
import { NormalizeTradesService } from 'src/normalizeTrades/normalizeTrades.service';
import { ReportReaderService } from 'src/reportReader/reportReader.service';

@Module({
  providers: [
    NormalizeReportsService,
    NormalizeTradesService,
    ReportReaderService,
  ],
})
export class NormalizeReportsModule {}
