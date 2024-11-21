import { ApiProperty } from '@nestjs/swagger';
import { CurrencyExchangeResponse } from '../types/interfaces/currency-exchange-response.interface';

export class CurrencyExchange implements CurrencyExchangeResponse {
  @ApiProperty()
  currency: string;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  exchangedate: string;
}
