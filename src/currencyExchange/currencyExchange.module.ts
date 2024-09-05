import { Module } from '@nestjs/common';
import { CurrencyExchangeService } from './currencyExchange.service';

@Module({
  providers: [CurrencyExchangeService],
})
export class CurrencyExchangeModule {}
