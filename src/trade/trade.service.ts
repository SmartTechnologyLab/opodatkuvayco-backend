import { DealsService } from 'src/deals/deals.service';
import { Deal } from 'src/report/types/interfaces/deal.interface';
import { AccounAtStartType } from 'src/report/types/interfaces/report.interface';
import {
  GroupedTrades,
  Trade,
} from 'src/report/types/interfaces/trade.interface';

export class TradeService {
  private deals: Deal[] = [];
  private leftOvers: AccounAtStartType | null = null;
  private accountAtStart: AccounAtStartType | null = null;
  private buyQueue: GroupedTrades | null = null;
  private trades: GroupedTrades | null = null;
  private shortPositions: Trade[] = [];

  constructor(
    private dealService: DealsService,
    options: {
      trades: GroupedTrades;
      leftOvers?: AccounAtStartType;
    },
  ) {
    this.trades = options?.trades;

    if (options?.leftOvers) {
      this.leftOvers = options.leftOvers;
    }

    if (this.trades) {
      this.buyQueue = Object.keys(this.trades).reduce((obj, ticker) => {
        obj[ticker] = [];
        return obj;
      }, {} satisfies GroupedTrades);
    }
  }

  getTradesFromPreviousPeriod() {
    const tradesFromPreviousPeriod: GroupedTrades = {};

    for (const ticker in this.leftOvers) {
      if (!tradesFromPreviousPeriod[ticker]) {
        tradesFromPreviousPeriod[ticker] = this.trades[ticker]?.reduceRight(
          (acc, trade) => {
            if (trade.operation === 'buy' && this.leftOvers[ticker] > 0) {
              let quantity = 0;

              if (this.leftOvers[ticker] >= trade.quantity) {
                quantity = trade.quantity;
              } else {
                quantity = this.leftOvers[ticker];
              }

              this.leftOvers[ticker] -= trade.quantity;

              const commission = (trade.commission / trade.quantity) * quantity;

              acc.unshift({ ...trade, commission, quantity });
            }

            return acc;
          },
          [] as Trade[],
        );
      }
    }

    return tradesFromPreviousPeriod;
  }

  getLefovers() {
    return this.leftOvers ?? {};
  }

  async setDeal(buy: Trade, sell: Trade, commission: number) {
    const deal = await this.dealService.setDeal(buy, sell, commission);

    this.deals.push(deal);
  }

  async getDeals() {
    await this.processTrades();

    return this.deals;
  }

  async processTrades() {
    for (const ticker in this.trades) {
      await Promise.all(
        this.trades[ticker].map(
          async (trade) => await this.processTrade(trade),
        ),
      );
    }
  }

  async processTrade(trade: Trade) {
    if (trade.operation === 'buy') {
      await this.processBuy(trade);
    } else if (trade.operation === 'sell') {
      await this.proccessSell(trade);
    }
  }

  async proccessSell(trade: Trade) {
    if (this.buyQueue[trade.ticker].length > 0) {
      await this.processLongSell(trade);
    } else {
      this.processShortSell(trade);
    }
  }

  processShortSell(trade: Trade) {
    this.shortPositions.push(trade);
  }

  async processLongSell(sellTrade: Trade) {
    while (
      sellTrade.quantity > 0 &&
      this.buyQueue[sellTrade.ticker].length > 0
    ) {
      const buyTrade = this.buyQueue[sellTrade.ticker][0];

      const quantityToSell = Math.min(sellTrade.quantity, buyTrade.quantity);

      const commision =
        (sellTrade.commission / sellTrade.quantity) * quantityToSell;

      buyTrade.quantity -= quantityToSell;
      sellTrade.quantity -= quantityToSell;
      sellTrade.commission -= commision;

      await this.setDeal(
        { ...buyTrade, quantity: quantityToSell },
        { ...sellTrade, quantity: quantityToSell },
        commision,
      );

      if (buyTrade.quantity === 0) {
        this.buyQueue[sellTrade.ticker].shift();
      }
    }
  }

  async processBuy(buyTrade: Trade) {
    if (this.shortPositions.length > 0) {
      let remainingQuantity = buyTrade.quantity;

      while (remainingQuantity > 0 && this.shortPositions.length > 0) {
        const shortTrade = this.shortPositions[0];

        const quantityToCover = Math.min(
          remainingQuantity,
          shortTrade.quantity,
        );
        const commision =
          (shortTrade.commission / shortTrade.quantity) * quantityToCover;

        shortTrade.quantity -= quantityToCover;
        remainingQuantity -= quantityToCover;
        shortTrade.commission -= commision;

        await this.setDeal(
          { ...buyTrade, quantity: quantityToCover },
          { ...shortTrade, quantity: quantityToCover },
          commision,
        );

        if (!shortTrade.quantity) {
          this.shortPositions.shift();
        }
      }

      if (remainingQuantity) {
        this.buyQueue[buyTrade.ticker].push({
          ...buyTrade,
          quantity: remainingQuantity,
        });
      }
    } else {
      this.buyQueue[buyTrade.ticker].push(buyTrade);
    }
  }
}
