import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { ReportModule } from './report/report.module';
import { CurrencyExchangeModule } from './currencyExchange/currencyExchange.module';

@Module({
  imports: [
    AuthModule,
    PassportModule.register({ session: true }),
    ReportModule,
    CurrencyExchangeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
