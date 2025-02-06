import { Injectable } from '@nestjs/common';
import { IbkrTrade } from 'src/normalizeReports/types/interfaces/ibkr.interface';
import { Trade } from 'src/report/types/interfaces/trade.interface';
import { FreedomFinanceTrade } from 'src/normalizeReports/types/interfaces/freedomFinance.interface';
import { StockExchangeType } from 'src/normalizeReports/types/types/stock-exchange.type';
import { StockExchangeEnum } from './constants/enums';
import { TradesByStockExchange } from './types/types/stockExchange';
import { OperationType } from 'src/report/types/types/operation.type';
import { parse } from 'date-fns';

@Injectable()
export class NormalizeTradesService {
  constructor() {}

  private NORMALIZER_BY_STOCK_EXCHANGE = {
    [StockExchangeEnum.FREEDOM_FINANCE]:
      this.normalizedFreedomFinanceTrades.bind(this),
    [StockExchangeEnum.IBRK]: this.normalizedIbkrTrades.bind(this),
  };

  getNormalizedTrades(
    stockExchange: StockExchangeType,
    trades: TradesByStockExchange[StockExchangeEnum],
  ): Trade[] {
    return this.NORMALIZER_BY_STOCK_EXCHANGE[stockExchange](trades);
  }

  private isNormalizedTrade(trade: Trade | any): trade is Trade {
    return trade?.isNormalized;
  }

  private normalizedFreedomFinanceTrades(
    trades: Array<FreedomFinanceTrade | Trade>,
  ): Trade[] {
    return trades.map((trade) => {
      if (this.isNormalizedTrade(trade)) {
        return trade;
      }

      return {
        ticker: trade.instr_nm?.split('.').at(0),
        price: trade.p,
        commission: trade.commission,
        operation: trade.operation,
        quantity: trade.q,
        date: trade.date,
        currency: trade.curr_c,
        isNormalized: true,
      };
    });
  }

  private normalizedIbkrTrades(trades: Array<IbkrTrade | Trade>): Trade[] {
    return trades.map((trade) => {
      if (this.isNormalizedTrade(trade)) {
        return trade;
      }

      const operation = trade.buySell.toLowerCase() as OperationType;

      return {
        ticker: trade.symbol,
        price: Number(trade.tradePrice),
        commission: Number(trade.ibCommission),
        operation,
        quantity: Number(trade.quantity),
        date: parse(trade.tradeDate, 'yyyyMMdd', new Date()).toString(),
        currency: trade.currency,
        isNormalized: true,
      };
    });
  }
}
