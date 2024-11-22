import { Controller, Get, Injectable, Query } from '@nestjs/common';
import { CurrencyRateService } from './currencyRate.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrencyExchange } from './entity/currency-exchange.entity';

@ApiTags('CurrencyRate')
@Injectable()
@Controller('currency-rate')
export class CurrencyRateController {
  constructor(private currencyExchangeService: CurrencyRateService) {}

  @ApiResponse({
    status: 200,
    type: [CurrencyExchange],
  })
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
