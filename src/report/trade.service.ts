import { DealsService } from 'src/deals/deals.service';
import { Deal } from './types/interfaces/deal.interface';
import { Trade } from './types/interfaces/trade.interface';

export class DealService {
  deals: Deal[] = [];
  private buyQueue: Trade[] = [];
  private trades: Record<string, Trade[]> = {};
  private shortPositions: Trade[] = [];

  constructor(
    private dealService: DealsService,
    trades: Record<string, Trade[]>,
  ) {
    this.trades = trades;
  }

  async setDeal(buy: Trade, sell: Trade, commission: number) {
    const deal = await this.dealService.setDeal(buy, sell, commission);

    this.deals.push(deal);
  }

  async processTrades() {
    for (const trades in this.trades) {
      for (const trade of this.trades[trades]) {
        await this.processTrade(trade);
      }
    }
  }

  async processTrade(trade: Trade) {
    if (trade.operation === 'buy') {
      await this.processBuy(trade);
    } else if (trade.operation === 'sell') {
      if (this.buyQueue.length > 0) {
        await this.processLongSell(trade);
      } else {
        this.processShortSell(trade);
      }
    }
  }

  processShortSell(trade: Trade) {
    this.shortPositions.push(trade);
  }

  async processLongSell(sellTrade: Trade) {
    while (sellTrade.quantity > 0 && this.buyQueue.length > 0) {
      const buyTrade = this.buyQueue[0];

      const quantityToSell = Math.min(sellTrade.quantity, buyTrade.quantity);
      buyTrade.quantity -= quantityToSell;
      sellTrade.quantity -= quantityToSell;

      await this.setDeal(
        { ...buyTrade, quantity: quantityToSell },
        { ...sellTrade, quantity: quantityToSell },
        0,
      );

      if (buyTrade.quantity === 0) {
        this.buyQueue.shift();
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
        shortTrade.quantity -= quantityToCover;
        remainingQuantity -= quantityToCover;

        await this.setDeal(
          { ...shortTrade, quantity: quantityToCover },
          { ...buyTrade, quantity: quantityToCover },
          0,
        );

        if (!shortTrade.quantity) {
          this.shortPositions.shift();
        }
      }

      if (remainingQuantity) {
        this.buyQueue.push({ ...buyTrade, quantity: remainingQuantity });
      }
    } else {
      this.buyQueue.push(buyTrade);
    }
  }
}
