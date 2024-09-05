import { Injectable } from '@nestjs/common';
import { StockExchange } from '../normalizeTrades/constants';
import { IReport } from '../report/types';
import {
  IFreedomFinanceReport,
  IFreedomFinanceTrade,
} from '../report/types/freedomFinance';

@Injectable()
export class NormalizeReportsService {
  constructor() {}

  getReportByStockExchange(
    report: unknown,
    stockExchange: StockExchange,
  ): IReport<unknown> {
    switch (stockExchange) {
      case StockExchange.FREEDOM_FINANCE:
        return this.normalizeFreedomFinanceReport(
          report as IFreedomFinanceReport,
        );
      default:
        break;
    }
  }

  normalizeFreedomFinanceReport(
    report: IFreedomFinanceReport,
  ): IReport<IFreedomFinanceTrade> {
    return {
      dateStart: report.date_start,
      trades: report.trades.detailed,
    };
  }
}
