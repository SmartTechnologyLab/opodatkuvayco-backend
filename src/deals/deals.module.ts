import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CurrencyRateService } from 'src/currencyExchange/currencyRate.service';
import { DateTimeFormatService } from 'src/dateTimeFormat/dateFormat.service';

@Module({
  exports: [DealsService],
  providers: [DealsService, CurrencyRateService, DateTimeFormatService],
})
export class DealsModule {}
