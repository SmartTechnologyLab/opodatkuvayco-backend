import { Injectable } from '@nestjs/common';
import { GrouppedTrades, ITrade } from 'src/report/types';
import { groupBy } from 'ramda';
import { StockExchange } from './constants';
import { IFreedomFinanceTrade } from 'src/report/types/freedomFinance';

@Injectable()
export class NormalizeTradesService {
  constructor() {}

  groupTradesByTicker<T>(
    trades: T[],
    stockExchange: StockExchange,
  ): GrouppedTrades {
    const normalizedTrades = this.getNormalizedTrades(stockExchange, trades);

    return groupBy((deal: ITrade) => deal.ticker, normalizedTrades);
  }

  getNormalizedTrades(
    stockExchange: StockExchange,
    trades: unknown[],
  ): ITrade[] {
    switch (stockExchange) {
      case StockExchange.FREEDOM_FINANCE:
        return this.normalizedFreedomFinanceTrades(
          trades as IFreedomFinanceTrade[],
        );
      default:
        break;
    }
  }

  normalizedFreedomFinanceTrades(
    trades: (IFreedomFinanceTrade | ITrade)[],
  ): ITrade[] {
    const conformingTrades: ITrade[] = trades.filter(this.isITrade);
    const nonConformingTrades = trades.filter(
      (trade) => !this.isITrade(trade),
    ) as IFreedomFinanceTrade[];

    const mappedTrades = nonConformingTrades.map((trade) => {
      return {
        ticker: trade.instr_nm?.split('.').at(0),
        price: trade.p,
        commission: trade.commission,
        operation: trade.operation,
        quantity: trade.q,
        date: trade.date,
        currency: trade.curr_c,
      };
    });

    return [...conformingTrades, ...mappedTrades];
  }

  isITrade(trade: unknown): trade is ITrade {
    return trade.hasOwnProperty('ticker');
  }
}
