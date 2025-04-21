import { DealsService } from 'src/deals/deals.service';
import { Deal } from 'src/report/types/interfaces/deal.interface';
import { AccounAtStartType } from 'src/report/types/interfaces/report.interface';
import {
  GroupedTrades,
  Trade,
} from 'src/report/types/interfaces/trade.interface';
import { reject, equals, mergeDeepWith, concat, isNotEmpty } from 'ramda';

export class TradeService {
  private deals: Deal[] = [];
  private leftOvers: AccounAtStartType | null = null;
  private buyQueue: GroupedTrades | null = null;
  private trades: GroupedTrades | null = null;
  private shortPositions: GroupedTrades | null = {};

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

  setTrades(newTrades: GroupedTrades) {
    this.trades = mergeDeepWith(concat, newTrades, this.trades);
  }

  sumSellTradesQuantity(trade: Trade, quantity: number) {
    return trade.operation === 'sell' ? trade.quantity : quantity;
  }

  // Getting total trades quantity that have to be taken from previous period
  getNeededTradesFromPreviousPeriod(
    trades: GroupedTrades,
    accountAtStart: AccounAtStartType,
  ) {
    const neededTradesMap: Record<string, number> = {};

    for (const ticker in trades) {
      if (accountAtStart[ticker]) {
        const totalSell = trades[ticker].reduce(
          (acc, trade) => this.sumSellTradesQuantity(trade, acc),
          0,
        );

        neededTradesMap[ticker] = Math.min(accountAtStart[ticker], totalSell);
      }
    }

    return reject(equals(0), neededTradesMap);
  }

  getTradesFromPreviousPeriod() {
    return Object.keys(this.leftOvers).reduce((acc, ticker) => {
      if (!this.trades[ticker] || !this.leftOvers[ticker]) return acc;

      const trades = this.trades[ticker].reduceRight<Trade[]>(
        (result, trade) => {
          if (trade.operation === 'buy' && this.leftOvers[ticker] > 0) {
            const quantity = Math.min(this.leftOvers[ticker], trade.quantity);
            this.leftOvers[ticker] -= trade.quantity;

            const commission = this.processCommission(trade, quantity);

            if (quantity) {
              result.unshift({ ...trade, quantity, commission });
            }
          }

          return result;
        },
        [],
      );

      if (trades.length) {
        acc[ticker] = trades;
      }

      return acc;
    }, {} as GroupedTrades);
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
    for (const trade of Object.values(this.trades).flatMap(
      (trades) => trades,
    )) {
      await this.processTrade(trade);
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
    return isNotEmpty(this.buyQueue[trade.ticker])
      ? await this.processLongSell(trade)
      : this.enqueShortPositions(trade);
  }

  async processLongSell(sellTrade: Trade) {
    while (sellTrade.quantity && this.buyQueue[sellTrade.ticker].length) {
      const buyTrade = this.buyQueue[sellTrade.ticker][0];

      const quantityToSell = this.processQuantity(sellTrade, buyTrade.quantity);

      const commision = this.processCommission(sellTrade, quantityToSell);

      buyTrade.quantity -= quantityToSell;
      sellTrade.quantity -= quantityToSell;
      sellTrade.commission -= commision;

      await this.setDeal(
        { ...buyTrade, quantity: quantityToSell },
        { ...sellTrade, quantity: quantityToSell },
        commision,
      );

      if (!buyTrade.quantity) {
        this.dequeBuyQueue(buyTrade);
      }

      // If sell trade has more quantity than buy trade, we need to add it to short positions queue since buy quantity remained more than 0
      if (this.isShortPosition(buyTrade, sellTrade)) {
        this.enqueShortPositions(sellTrade);
      }
    }
  }

  // Proccessing buy trade with two possible scenarios:
  // If there are no short positions in queue, we add buy trade to buy queue
  // if there are short positions in queue we close them or partially close
  // For example: MSFT ticker has 1 short position with quantity 10 and buy trade with quantity 5
  // In this case we close short positions with quantity 5 and calculating 10 - 5 = 5 of remaining short position
  async processBuy(buyTrade: Trade) {
    // executes when buy trade occures and there are short positions in queue
    if (this.shortPositions[buyTrade.ticker]?.length > 0) {
      let remainingQuantity = buyTrade.quantity;

      while (
        remainingQuantity &&
        this.shortPositions[buyTrade.ticker]?.length
      ) {
        const shortTrade = this.shortPositions[buyTrade.ticker][0];

        const quantityToCover = this.processQuantity(
          shortTrade,
          remainingQuantity,
        );

        const commision = this.processCommission(shortTrade, quantityToCover);

        shortTrade.quantity -= quantityToCover;
        remainingQuantity -= quantityToCover;
        shortTrade.commission -= commision;

        await this.setDeal(
          { ...buyTrade, quantity: quantityToCover },
          { ...shortTrade, quantity: quantityToCover },
          commision,
        );

        // If no remaining quantity of short trade, remove it from short positions queue
        this.dequeShortPositions(shortTrade);
      }

      // If remaining quantity exists after short deal closed, add buy trade to buy queue
      if (remainingQuantity) {
        this.enqueBuyQueue({ ...buyTrade, quantity: remainingQuantity });
      }
    } else {
      // If short position queue is empty, add buy trade to buy queue
      this.enqueBuyQueue(buyTrade);
    }
  }

  processCommission(trade: Trade, dealQuantity: number) {
    const commission = (trade.commission / trade.quantity) * dealQuantity;

    return commission;
  }

  processQuantity(trade: Trade, dealQuantity: number) {
    const quantity = Math.min(trade.quantity, dealQuantity);

    return quantity;
  }

  // To check if current trade is short position that were processed in long sell and quantity of sell trade remained
  isShortPosition(buyTrade: Trade, sellTrade: Trade) {
    return (
      !buyTrade.quantity &&
      sellTrade.quantity &&
      !this.buyQueue[sellTrade.ticker].length
    );
  }

  enqueBuyQueue(trade: Trade) {
    if (!this.buyQueue[trade.ticker]) {
      this.buyQueue[trade.ticker] = [];
    }

    this.buyQueue[trade.ticker].push(trade);
  }

  dequeBuyQueue(trade: Trade) {
    this.buyQueue[trade.ticker]?.shift();
  }

  enqueShortPositions(trade: Trade) {
    if (!this.shortPositions[trade.ticker]) {
      this.shortPositions[trade.ticker] = [];
    }

    this.shortPositions[trade.ticker].push(trade);
  }

  dequeShortPositions(trade: Trade) {
    if (!trade.quantity) {
      this.shortPositions[trade.ticker]?.shift();
    }
  }
}
