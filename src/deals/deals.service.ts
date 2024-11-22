import { BadRequestException, Injectable } from '@nestjs/common';
import { CurrencyRateService } from 'src/currencyExchange/currencyRate.service';
import { DateTimeFormatService } from 'src/dateTimeFormat/dateFormat.service';
import { DealOptions } from 'src/report/types/interfaces/deal-options.interface';
import { Deal } from 'src/report/types/interfaces/deal.interface';
import { Trade } from 'src/report/types/interfaces/trade.interface';
import { v4 as uuid } from 'uuid';
import { clone, groupBy } from 'ramda';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Deal as DealEntity,
  Trade as TradeEntity,
} from './entities/deals.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(DealEntity)
    private dealRepository: Repository<DealEntity>,
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
  }

  async setDeal(
    purchaseTrade: Trade,
    sellTrade: Trade,
    commission: number,
  ): Promise<Deal> {
    const [purchaseRate, saleRate] = await this.fetchPurchaseAndSellRate(
      purchaseTrade,
      sellTrade,
    );

    const quantityToProcess = Math.min(
      purchaseTrade.quantity,
      sellTrade.quantity,
    );

    const deal = this.generateDeal({
      ticker: purchaseTrade.ticker,
      purchaseCommission: purchaseTrade.commission,
      purchaseDate: new Date(purchaseTrade.date),
      purchasePrice: purchaseTrade.price,
      purchaseRate,
      quantity: quantityToProcess,
      saleCommission: commission * purchaseTrade.quantity,
      saleDate: new Date(sellTrade.date),
      salePrice: sellTrade.price,
      saleRate,
    });

    sellTrade.quantity -= quantityToProcess;
    purchaseTrade.quantity -= quantityToProcess;

    return deal;
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

  async saveDeals(deals: Deal[], user: User): Promise<DealEntity[]> {
    try {
      const dealEntities = deals.map((deal) => {
        const purchase = new TradeEntity();
        purchase.date = deal.purchase.date;
        purchase.price = deal.purchase.price;
        purchase.sum = deal.purchase.sum;
        purchase.commission = deal.purchase.commission;
        purchase.rate = deal.purchase.rate;
        purchase.uah = deal.purchase.uah;

        const sale = new TradeEntity();
        sale.date = deal.sale.date;
        sale.price = deal.sale.price;
        sale.sum = deal.sale.sum;
        sale.commission = deal.sale.commission;
        sale.rate = deal.sale.rate;
        sale.uah = deal.sale.uah;

        const dealEntity = new DealEntity();
        dealEntity.id = deal.id;
        dealEntity.percent = deal.percent;
        dealEntity.quantity = deal.quantity;
        dealEntity.ticker = deal.ticker;
        dealEntity.total = deal.total;
        dealEntity.purchase = purchase;
        dealEntity.sale = sale;
        dealEntity.user = user;

        return dealEntity;
      });

      return this.dealRepository.save(dealEntities);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async getDeals(userId: string): Promise<DealEntity[]> {
    const deals = await this.dealRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['purchase', 'sale'],
    });

    return deals;
  }
}
