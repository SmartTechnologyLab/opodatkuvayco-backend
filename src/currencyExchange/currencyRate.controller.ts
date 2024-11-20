import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { CurrencyRateService } from './currencyRate.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('currency-rate')
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
