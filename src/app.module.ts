import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportModule } from './report/report.module';
import { CurrencyExchangeModule } from './currencyExchange/currencyExchange.module';
import { NormalizeTradesModule } from './normalizeTrades/normalizeTrades.module';
import { NormalizeReportsModule } from './normalizeReports/normalizeReports.module';
import { HealthController } from './health/health.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ReportModule,
    CurrencyExchangeModule,
    NormalizeTradesModule,
    NormalizeReportsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
