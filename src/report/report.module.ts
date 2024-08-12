import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { CurrencyExchangeModule } from 'src/currencyExchange/currencyExchange.module';
import { CurrencyExchangeService } from 'src/currencyExchange/currencyExchange.service';
import { NormalizeTradesModule } from 'src/normalizeTrades/normalizeTrades.module';
import { NormalizeTradesService } from 'src/normalizeTrades/normalizeTrades.service';

@Module({
  imports: [CurrencyExchangeModule, NormalizeTradesModule],
  controllers: [ReportController],
  providers: [ReportService, CurrencyExchangeService, NormalizeTradesService],
})
export class ReportModule {}
