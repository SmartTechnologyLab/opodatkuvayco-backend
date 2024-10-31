import { ApiProperty } from '@nestjs/swagger';

export class CurrencyRateResponse {
  @ApiProperty()
  rate: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  exchangeDate: string;
}
