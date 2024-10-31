import { ApiProperty } from '@nestjs/swagger';

export class TransactionDetails {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  price: number;

  @ApiProperty()
  sum: number;

  @ApiProperty()
  commission: number;

  @ApiProperty()
  rate: number;

  @ApiProperty()
  uah: number;
}

export class Deal {
  @ApiProperty()
  id: symbol;

  @ApiProperty()
  percent: number;

  @ApiProperty({ type: () => TransactionDetails })
  purchase: TransactionDetails;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: () => TransactionDetails })
  sale: TransactionDetails;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  total: number;
}

class DealReport {
  @ApiProperty()
  total: number;

  @ApiProperty()
  totalTaxFee: number;

  @ApiProperty()
  totalMilitaryFee: number;

  @ApiProperty({ type: () => Deal })
  deals: Deal[];
}

export class ReportResponse {
  @ApiProperty({ type: () => DealReport })
  deals: DealReport;
}
