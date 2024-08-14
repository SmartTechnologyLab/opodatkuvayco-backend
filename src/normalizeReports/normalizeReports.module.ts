import { Module } from '@nestjs/common';
import { NormalizeReportsService } from './normalizeReports.service';

@Module({
  providers: [NormalizeReportsService],
})
export class NormalizeReportsModule {}
