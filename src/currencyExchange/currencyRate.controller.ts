import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { CurrencyRateService } from './currencyRate.service';

@Injectable()
@Controller('currency-rate')
export class CurrencyRateController {
  constructor(private currencyExchangeService: CurrencyRateService) {}

  @Get()
  async getUahCurrenyRate(
    @Query('currency') currency: string,
    @Query('date') date: string,
  ) {
    const rate = await this.currencyExchangeService.getCurrencyExchange(
      currency,
      date,
    );

    return rate;
  }
}
