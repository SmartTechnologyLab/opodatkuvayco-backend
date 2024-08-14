import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { CurrencyExchangeModule } from 'src/currencyExchange/currencyExchange.module';
import { CurrencyExchangeService } from 'src/currencyExchange/currencyExchange.service';
import { NormalizeTradesModule } from 'src/normalizeTrades/normalizeTrades.module';
import { NormalizeTradesService } from 'src/normalizeTrades/normalizeTrades.service';
import { NormalizeReportsModule } from 'src/normalizeReports/normalizeReports.module';
import { NormalizeReportsService } from 'src/normalizeReports/normalizeReports.service';

@Module({
  imports: [
    CurrencyExchangeModule,
    NormalizeTradesModule,
    NormalizeReportsModule,
  ],
  controllers: [ReportController],
  providers: [
    ReportService,
    CurrencyExchangeService,
    NormalizeTradesService,
    NormalizeReportsService,
  ],
})
export class ReportModule {}
