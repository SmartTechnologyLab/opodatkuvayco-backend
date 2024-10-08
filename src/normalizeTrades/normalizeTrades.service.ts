import { Injectable } from '@nestjs/common';
import { GrouppedTrades, ITrade } from 'src/report/types';
import { groupBy } from 'ramda';
import { StockExchange } from './constants';
import { IFreedomFinanceTrade } from '../report/types/freedomFinance';

@Injectable()
export class NormalizeTradesService {
  constructor() {}

  private MAP_STOCK_EXCHANGE_TO_TRADE_TYPE = {
    [StockExchange.FREEDOM_FINANCE]:
      this.normalizedFreedomFinanceTrades.bind(this),
  };

  getNormalizedTrades(
    stockExchange: StockExchange,
    trades: unknown[],
  ): ITrade[] {
    return this.MAP_STOCK_EXCHANGE_TO_TRADE_TYPE[stockExchange](
      trades as IFreedomFinanceTrade[],
    );
  }

  normalizedFreedomFinanceTrades(
    trades: (IFreedomFinanceTrade | ITrade)[],
  ): ITrade[] {
    const conformingTrades: ITrade[] = trades.filter(this.isITrade);
    const nonConformingTrades = trades.filter(
      (trade) => !this.isITrade(trade),
    ) as IFreedomFinanceTrade[];

    const mappedTrades: ITrade[] = nonConformingTrades.map((trade) => ({
      ticker: trade.instr_nm?.split('.').at(0),
      price: trade.p,
      commission: trade.commission,
      operation: trade.operation,
      quantity: trade.q,
      date: trade.date,
      currency: trade.curr_c,
    }));

    return [...conformingTrades, ...mappedTrades];
  }

  isITrade(trade: unknown): trade is ITrade {
    return trade.hasOwnProperty('ticker');
  }
}
