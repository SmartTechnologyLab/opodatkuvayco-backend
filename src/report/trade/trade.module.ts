import { Module } from '@nestjs/common';
import { TradeService } from './trade.service';

@Module({
  exports: [TradeService],
  providers: [TradeService],
})
export class TradeModule {}
