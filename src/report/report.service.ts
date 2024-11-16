import { BadRequestException, Injectable } from '@nestjs/common';
import { reverse } from 'ramda';
import { sortByDate } from './helpers';
import { NormalizeReportsService } from '../normalizeReports/normalizeReports.service';
import { ReportReaderService } from 'src/reportReader/reportReader.service';
import { FileType } from 'src/reportReader/types';
import { Trade } from './types/interfaces/trade.interface';
import { DealReport } from './types/interfaces/deal-report.interface';
import { Deal } from './types/interfaces/deal.interface';
import { Report } from './types/interfaces/report.interface';
import { StockExchangeType } from 'src/normalizeReports/types/types/stock-exchange.type';
import { MILITARY_FEE, TAX_FEE } from './consts/tax-fee-percentages';
import { DealsService } from '../deals/deals.service';

@Injectable()
export class ReportService {
  constructor(
    private normalizeReportsService: NormalizeReportsService,
    private reportReaderService: ReportReaderService,
    private dealsService: DealsService,
  ) {}

  // TODO: Refactor algorithm
  private async getReportExtended(trades: Trade[]): Promise<DealReport<Deal>> {
    const deals: Deal[] = [];

    const groupedTrades = this.dealsService.groupTradesByTicker(trades);

    for (const ticker in groupedTrades) {
      let buyQueue: Trade[] = [];
      let sellComission = 0;

      for (const trade of groupedTrades[ticker]) {
        if (trade.operation === 'buy' && trade.quantity > 0) {
          const existingTrade = this.dealsService.findDealByDateAndPrice(
            buyQueue,
            trade,
          );
          if (existingTrade) {
            existingTrade.quantity += trade.quantity;
            existingTrade.commission += trade.commission;
          } else {
            buyQueue.push(trade);
          }
        } else if (trade.operation === 'sell' && buyQueue.length > 0) {
          sellComission = trade.commission / trade.quantity;

          for (const purchaseDeal of buyQueue) {
            if (trade.quantity > 0 && purchaseDeal.quantity > 0) {
              const newDeal = await this.setDeal(
                purchaseDeal,
                trade,
                sellComission,
              );

              deals.push(newDeal);
            }
          }

          buyQueue = buyQueue.filter(
            (purchaseDeal) => purchaseDeal.quantity > 0,
          );

          while (
            trade.quantity > 0 &&
            (buyQueue.some((b) => b.quantity > 0) ||
              this.getShortBuy(groupedTrades[ticker], trade))
          ) {
            const foundShortBuy = buyQueue.some((b) => Boolean(b.quantity))
              ? buyQueue.filter((b) => Boolean(b.quantity)).at(0)
              : this.getShortBuy(groupedTrades[ticker], trade);

            if (foundShortBuy && Boolean(foundShortBuy.quantity)) {
              const newDeal = await this.setDeal(
                foundShortBuy,
                trade,
                sellComission,
              );

              deals.push(newDeal);
            }
          }
        } else if (
          trade.operation === 'sell' &&
          buyQueue.length === 0 &&
          this.getShortBuy(groupedTrades[ticker], trade)
        ) {
          sellComission = trade.commission / trade.quantity;

          const foundShortBuy = this.getShortBuy(groupedTrades[ticker], trade);

          if (foundShortBuy) {
            const newDeal = await this.setDeal(
              foundShortBuy,
              trade,
              sellComission,
            );

            deals.push(newDeal);
          }
        }
        sellComission = 0;
      }

      if (
        groupedTrades[ticker].some(
          (deal) => deal.operation === 'sell' && deal.quantity > 0,
        )
      ) {
        throw new BadRequestException('Not enough buy deals');
      }
    }

    const total = deals.reduce((acc, deal) => acc + deal.total, 0);

    const totalTaxFee = this.getTotalTaxFee(total);

    const totalMilitaryFee = this.getMilitaryFee(total);

    return {
      total,
      totalTaxFee,
      totalMilitaryFee,
      deals: deals.sort((a, b) => a.ticker.localeCompare(b.ticker)),
    };
  }

  private async getPrevTrades(trades: Trade[]): Promise<Trade[]> {
    const remainedPurchaseDeals: Trade[] = [];

    const groupedTrades = this.dealsService.groupTradesByTicker(trades);

    for (const ticker in groupedTrades) {
      let buyQueue: Trade[] = [];
      for (const deal of groupedTrades[ticker]) {
        if (deal.operation === 'buy' && deal.quantity > 0) {
          const existingDeal = this.dealsService.findDealByDateAndPrice(
            buyQueue,
            deal,
          );
          if (existingDeal) {
            existingDeal.quantity += deal.quantity;
            existingDeal.commission += deal.commission;
          } else {
            buyQueue.push(deal);
          }
        } else if (deal.operation === 'sell' && buyQueue.length > 0) {
          for (const purchaseDeal of buyQueue) {
            if (deal.quantity >= purchaseDeal.quantity) {
              const quantityToProcess = Math.min(
                purchaseDeal.quantity,
                deal.quantity,
              );
              deal.quantity -= quantityToProcess;
              purchaseDeal.quantity -= quantityToProcess;
            }
          }

          buyQueue = buyQueue.filter(
            (purchaseDeal) => purchaseDeal.quantity > 0,
          );

          while (
            deal.quantity > 0 &&
            (buyQueue.some((b) => b.quantity > 0) ||
              this.getShortBuy(groupedTrades[ticker], deal))
          ) {
            const foundShortBuy = buyQueue.some((b) => b.quantity > 0)
              ? buyQueue.filter((b) => b.quantity > 0).at(0)
              : this.getShortBuy(groupedTrades[ticker], deal);

            if (foundShortBuy && foundShortBuy.quantity > 0) {
              const quantityToProcess = Math.min(
                foundShortBuy.quantity,
                deal.quantity,
              );
              foundShortBuy.quantity -= quantityToProcess;
              deal.quantity -= quantityToProcess;
            }
          }
        } else if (
          deal.operation === 'sell' &&
          buyQueue.length === 0 &&
          this.getShortBuy(groupedTrades[ticker], deal)
        ) {
          const foundShortBuy = this.getShortBuy(groupedTrades[ticker], deal);

          if (foundShortBuy) {
            const quantityToProcess = Math.min(
              foundShortBuy.quantity,
              deal.quantity,
            );
            deal.quantity -= quantityToProcess;
            foundShortBuy.quantity -= quantityToProcess;
          }
        }
      }
      remainedPurchaseDeals.push(
        ...buyQueue.filter((deal) => deal.quantity > 0),
      );
    }

    return remainedPurchaseDeals;
  }

  private async getNormalReport(report: Trade[]): Promise<DealReport<Deal>> {
    const {
      deals: extendedDeals,
      total,
      totalMilitaryFee,
      totalTaxFee,
    } = await this.getReportExtended(report);

    const deals = Object.values(
      extendedDeals.reduce(
        (acc, deal) => {
          if (!acc[deal.ticker]) {
            acc[deal.ticker] = deal;
          } else {
            acc[deal.ticker].sale.uah += deal.sale.uah;
            acc[deal.ticker].purchase.uah += deal.purchase.uah;
            acc[deal.ticker].total += deal.total;
          }
          return acc;
        },
        {} as Record<string, Deal>,
      ),
    );

    return {
      total,
      totalTaxFee,
      totalMilitaryFee,
      deals,
    };
  }

  private getShortBuy(trades: Trade[], currentSellTrade: Trade) {
    return trades.find(
      (trade, indx) =>
        trade.operation === 'buy' &&
        trade.quantity > 0 &&
        indx > trades.indexOf(currentSellTrade),
    );
  }

  private async setDeal(
    purchaseDeal: Trade,
    sellDeal: Trade,
    sellComission?: number,
  ): Promise<Deal> {
    const [purchaseRate, saleRate] =
      await this.dealsService.fetchPurchaseAndSellRate(purchaseDeal, sellDeal);

    const quantityToProcess = Math.min(
      purchaseDeal.quantity,
      sellDeal.quantity,
    );

    const deal = this.dealsService.generateDeal({
      ticker: purchaseDeal.ticker,
      purchaseCommission: purchaseDeal.commission,
      purchaseDate: new Date(purchaseDeal.date),
      purchasePrice: purchaseDeal.price,
      purchaseRate,
      quantity: quantityToProcess,
      saleCommission: sellComission * purchaseDeal.quantity,
      saleDate: new Date(sellDeal.date),
      salePrice: sellDeal.price,
      saleRate,
    });

    sellDeal.quantity -= quantityToProcess;
    purchaseDeal.quantity -= quantityToProcess;

    return deal;
  }

  private getReportFunction(
    reportType: string,
  ): (
    trades: Trade[],
    stockExchange: StockExchangeType,
  ) => Promise<DealReport<Deal>> {
    return reportType === 'extended'
      ? this.getReportExtended.bind(this)
      : this.getNormalReport.bind(this);
  }

  private async handleSingleReport({
    files,
    fileType,
    stockExchange,
    reportType,
  }: {
    files: Express.Multer.File[];
    reportType: string;
    stockExchange: StockExchangeType;
    fileType: FileType;
  }) {
    const getReportFunction = this.getReportFunction(reportType);

    const report = this.reportReaderService.readReport(files.at(0), fileType);

    const { trades } = this.normalizeReportsService.getReportByStockExchange(
      report,
      stockExchange,
    );

    return getReportFunction(trades, stockExchange);
  }

  private async handleMultipleReports({
    files,
    fileType,
    stockExchange,
    reportType,
  }: {
    files: Express.Multer.File[];
    reportType: string;
    stockExchange: StockExchangeType;
    fileType: FileType;
  }) {
    const getReportFunction = this.getReportFunction(reportType);

    const reports: Report<Trade>[] = [];
    const dealsToCalculate: Trade[] = [];

    files.forEach((file) => {
      const report = this.reportReaderService.readReport(file, fileType);

      reports.push(
        this.normalizeReportsService.getReportByStockExchange(
          report,
          stockExchange,
        ) as Report<Trade>,
      );
    });

    const sortedReportsByDate: Report<Trade>[] = sortByDate(reports);

    const reversedReports: Report<Trade>[] = reverse(sortedReportsByDate);

    const remainedDealsMap = new Map<number, Trade[]>();

    for (const [indx, statement] of Object.entries(reversedReports)) {
      const index = +indx;

      if (index !== sortedReportsByDate.length - 1) {
        const previousDeals = remainedDealsMap.get(index - 1) || [];

        const deals = await this.getPrevTrades(
          previousDeals.length
            ? [...previousDeals, ...statement.trades]
            : statement.trades,
        );

        if (!remainedDealsMap.has(index)) {
          remainedDealsMap.set(index, []);
        }

        if (deals.length) {
          remainedDealsMap.get(index)?.push(...deals);
        }

        if (index === sortedReportsByDate.length - 2 && deals.length) {
          dealsToCalculate.push(...deals);
        }
      }
    }

    return getReportFunction(
      [...dealsToCalculate, ...sortedReportsByDate.at(0).trades],
      stockExchange,
    );
  }

  async handleReports({
    files,
    reportType,
    stockExchange,
    fileType,
  }: {
    files: Express.Multer.File[];
    reportType: string;
    stockExchange: StockExchangeType;
    fileType: FileType;
  }): Promise<DealReport<Deal>> {
    if (files.length === 1) {
      return this.handleSingleReport({
        files,
        fileType,
        stockExchange,
        reportType,
      });
    } else {
      return this.handleMultipleReports({
        files,
        fileType,
        stockExchange,
        reportType,
      });
    }
  }

  private getTotalTaxFee(total: number) {
    if (total <= 0) {
      return 0;
    }

    return total * TAX_FEE;
  }

  private getMilitaryFee(total: number) {
    if (total <= 0) {
      return 0;
    }

    return total * MILITARY_FEE;
  }
}
