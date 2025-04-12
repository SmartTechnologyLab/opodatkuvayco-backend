import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CurrencyRateService } from 'src/currencyExchange/currencyRate.service';
import { DateTimeFormatService } from 'src/dateTimeFormat/dateFormat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal, Trade } from './entities/deals.entity';
import { DealsController } from './deals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Deal, Trade])],
  exports: [DealsService],
  controllers: [DealsController],
  providers: [DealsService, CurrencyRateService, DateTimeFormatService],
})
export class DealsModule {}
