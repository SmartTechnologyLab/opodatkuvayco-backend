import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { CurrencyExchangeModule } from 'src/currencyExchange/currencyExchange.module';
import { CurrencyExchangeService } from 'src/currencyExchange/currencyExchange.service';

@Module({
  imports: [CurrencyExchangeModule],
  controllers: [ReportController],
  providers: [ReportService, CurrencyExchangeService],
})
export class ReportModule {}
