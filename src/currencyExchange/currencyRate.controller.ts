import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { CurrencyRateService } from './currencyRate.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrencyRateResponse } from './currencyExchange.response';

@Injectable()
@ApiTags('currency-rate')
@Controller('currency-rate')
export class CurrencyRateController {
  constructor(private currencyExchangeService: CurrencyRateService) {}

  @ApiResponse({
    type: CurrencyRateResponse,
  })
  @Get('uah')
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
