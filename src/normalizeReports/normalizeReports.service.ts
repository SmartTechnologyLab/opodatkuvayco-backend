import { Injectable } from '@nestjs/common';
import { StockExchange } from '../normalizeTrades/constants';
import { IReport, ITrade } from '../report/types';
import { IFreedomFinanceReport } from '../report/types/freedomFinance';
import { NormalizeTradesService } from '../normalizeTrades/normalizeTrades.service';

@Injectable()
export class NormalizeReportsService {
  constructor(private normalizeTradeService: NormalizeTradesService) {}

  private MAP_STOCK_EXCHANGE_TO_REPORT_TYPE = {
    [StockExchange.FREEDOM_FINANCE]:
      this.normalizeFreedomFinanceReport.bind(this),
  };

  getReportByStockExchange(
    report: unknown,
    stockExchange: StockExchange,
  ): IReport<ITrade> {
    return this.MAP_STOCK_EXCHANGE_TO_REPORT_TYPE[stockExchange](report);
  }

  normalizeFreedomFinanceReport(
    report: IFreedomFinanceReport,
  ): IReport<ITrade> {
    return {
      dateStart: report.date_start,
      trades: this.normalizeTradeService.normalizedFreedomFinanceTrades(
        report.trades.detailed,
      ),
    };
  }
}
