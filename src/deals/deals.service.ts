import { BadRequestException, Injectable } from '@nestjs/common';
import { CurrencyRateService } from 'src/currencyExchange/currencyRate.service';
import { DateTimeFormatService } from 'src/dateTimeFormat/dateFormat.service';
import { DealOptions } from 'src/report/types/interfaces/deal-options.interface';
import { Deal } from 'src/report/types/interfaces/deal.interface';
import { Trade } from 'src/report/types/interfaces/trade.interface';
import { v4 as uuid } from 'uuid';
import { clone, groupBy } from 'ramda';

@Injectable()
export class DealsService {
  constructor(
    private currencyRateService: CurrencyRateService,
    private dateTimeFormatService: DateTimeFormatService,
  ) {}

  generateDeal({
    ticker,
    quantity,
    purchaseCommission,
    purchaseDate,
    purchasePrice,
    purchaseRate,
    saleCommission,
    saleDate,
    salePrice,
    saleRate,
  }: DealOptions = {}): Deal {
    const purchaseSum = purchasePrice * quantity;
    const _purchaseCommission = purchaseCommission || purchaseSum;
    const saleSum = salePrice * quantity;
    const _saleCommission = saleCommission || saleSum;
    const purchaseUah =
      (purchaseSum + _purchaseCommission) * purchaseRate +
      _saleCommission * saleRate;
    const saleUah = saleSum * saleRate;

    return {
      id: uuid(),
      purchase: {
        commission: _purchaseCommission,
        date: purchaseDate,
        price: purchasePrice,
        rate: purchaseRate,
        sum: purchaseSum,
        uah: purchaseUah,
      },
      quantity: quantity,
      sale: {
        commission: _saleCommission,
        date: saleDate,
        price: salePrice,
        rate: saleRate,
        sum: saleSum,
        uah: saleUah,
      },
      ticker: ticker,
      total: saleUah - purchaseUah,
      percent: saleUah / purchaseUah - 1,
    };
  }

  async fetchPurchaseAndSellRate(
    purchaseDeal: Trade,
    sellDeal: Trade,
  ): Promise<[number, number]> {
    try {
      const [{ rate: purchaseRate }, { rate: sellRate }] = await Promise.all([
        this.currencyRateService.getCurrencyExchange(
          purchaseDeal.currency,
          purchaseDeal.date,
        ),

        this.currencyRateService.getCurrencyExchange(
          sellDeal.currency,
          sellDeal.date,
        ),
      ]);

      return [purchaseRate, sellRate];
    } catch (error) {
      throw new BadRequestException('Error while fetching currency exchange');
    }
  }

  findDealByDateAndPrice(deals: Trade[], currentDeal: Trade) {
    return deals.find(
      (deal) =>
        this.dateTimeFormatService.format(deal.date, 'yyyy-MM-dd') ===
          this.dateTimeFormatService.format(currentDeal.date, 'yyyy-MM-dd') &&
        deal.price === currentDeal.price,
    );
  }

  groupTradesByTicker(trades: Trade[]): Record<Trade['ticker'], Trade[]> {
    const tradesCopy = clone(trades);

    return groupBy((deal: Trade) => {
      const ticker = deal.ticker.split('.').at(0);

      return ticker;
    }, tradesCopy);
  }
}
