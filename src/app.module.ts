import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportModule } from './report/report.module';
import { CurrencyExchangeModule } from './currencyExchange/currencyExchange.module';
import { NormalizeTradesModule } from './normalizeTrades/normalizeTrades.module';
import { NormalizeReportsModule } from './normalizeReports/normalizeReports.module';

@Module({
  imports: [
    ReportModule,
    CurrencyExchangeModule,
    NormalizeTradesModule,
    NormalizeReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
