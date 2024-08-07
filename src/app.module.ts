import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ReportModule } from './report/report.module';
import { CurrencyExchangeModule } from './currencyExchange/currencyExchange.module';

@Module({
  imports: [ReportModule, CurrencyExchangeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
