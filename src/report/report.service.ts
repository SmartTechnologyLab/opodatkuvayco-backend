import { BadRequestException, Injectable } from '@nestjs/common';
import { reverse } from 'ramda';
import { sortByDate } from './helpers';
import { NormalizeReportsService } from '../normalizeReports/normalizeReports.service';
import { ReportReaderService } from 'src/reportReader/reportReader.service';
import { FileType } from 'src/reportReader/types';
import { GroupedTrades, Trade } from './types/interfaces/trade.interface';
import { DealReport } from './types/interfaces/deal-report.interface';
import { Deal } from './types/interfaces/deal.interface';
import { Report } from './types/interfaces/report.interface';
import { StockExchangeType } from 'src/normalizeReports/types/types/stock-exchange.type';
import { MILITARY_FEE, TAX_FEE } from './consts/tax-fee-percentages';
import { DealsService } from '../deals/deals.service';
import { Report as ReportEntity } from 'src/report/entities/report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { StockExchangeEnum } from 'src/normalizeTrades/constants/enums';
import { TradeService } from 'src/trade/trade.service';
import { mergeDeepWith, concat } from 'ramda';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private reportRepository: Repository<ReportEntity>,
    private normalizeReportsService: NormalizeReportsService,
    private reportReaderService: ReportReaderService,
    private dealsService: DealsService,
  ) {}

  private async saveReport(
    report: DealReport<Deal>,
    user: User,
  ): Promise<ReportEntity> {
    try {
      const deals = await this.dealsService.saveDeals(report.deals, user);

      const newReport = new ReportEntity();

      newReport.total = report.total;
      newReport.totalMilitaryFee = report.totalMilitaryFee;
      newReport.totalTaxFee = report.totalTaxFee;
      newReport.deals = deals;
      newReport.user = user;

      return this.reportRepository.save(newReport);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

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
              const newDeal = await this.dealsService.setDeal(
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
              const newDeal = await this.dealsService.setDeal(
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
            const newDeal = await this.dealsService.setDeal(
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
    user,
  }: {
    files: Express.Multer.File[];
    reportType: string;
    stockExchange: StockExchangeType;
    fileType: FileType;
    user: User;
  }) {
    const getReportFunction = this.getReportFunction(reportType);

    const stockExchangeReport = this.reportReaderService.readReport(
      files.at(0),
      fileType,
    );

    const { trades } = this.normalizeReportsService.getReportByStockExchange(
      stockExchangeReport,
      stockExchange,
    );

    const result = await getReportFunction(trades, stockExchange);

    const report = await this.saveReport(result, user);

    return report;
  }

  getTradesBySingleFile(files: Express.Multer.File[]) {
    const { trades, accountAtStart, accountAtEnd, dateStart } =
      this.normalizeReportsService.getReportByStockExchange(
        files.at(0),
        StockExchangeEnum.FREEDOM_FINANCE,
      );

    const groupedTrades = this.dealsService.groupTradesByTicker(trades);

    return { groupedTrades, accountAtStart, accountAtEnd, dateStart };
  }

  sortDeals(deals: Deal[]) {
    return deals.sort((a, b) => a.ticker.localeCompare(b.ticker));
  }

  getTotalValue(deals: Deal[]) {
    return deals.reduce((acc, deal) => acc + deal.total, 0);
  }

  getSummary(deals: Deal[]) {
    const total = this.getTotalValue(deals);

    return {
      total,
      totalTaxFee: this.getTotalTaxFee(total),
      totalMilitaryFee: this.getMilitaryFee(total),
      deals: this.sortDeals(deals),
    };
  }

  async proccessSingleFileReport(files: Express.Multer.File[]) {
    const { groupedTrades } = this.getTradesBySingleFile(files);

    const tradeService = new TradeService(this.dealsService, {
      trades: groupedTrades,
    });

    const deals = await tradeService.getDeals();

    return this.getSummary(deals);
  }

  getTradesFromPreviousPeriod(
    files: Express.Multer.File[],
    leftOvers?: Record<string, number>,
  ) {
    const { groupedTrades, accountAtEnd } = this.getTradesBySingleFile(files);

    const tradeService = new TradeService(this.dealsService, {
      trades: groupedTrades,
      leftOvers: accountAtEnd,
    });

    const trades = tradeService.getTradesFromPreviousPeriod();

    console.log(trades, leftOvers ? leftOvers : accountAtEnd);

    return { trades, leftOvers: tradeService.getLefovers() };
  }

  async processMultipleFiles(files: Express.Multer.File[]) {
    const [, ...restFiles] = files;

    // const prevTrades = restFiles.reduce(
    //   (acc, file, index) => {
    //     if (index === 0) {
    //       const prevTradesResult = this.getTradesFromPreviousPeriod([file]);
    //       return prevTradesResult;
    //     } else {
    //       const { trades, leftOvers } = this.getTradesFromPreviousPeriod(
    //         [file],
    //         acc.leftOvers,
    //       );

    //       const mergedTrades = mergeDeepWith(concat, trades, acc.trades);

    //       return {
    //         trades: mergedTrades,
    //         leftOvers,
    //       };
    //     }
    //   },
    //   {} as {
    //     leftOvers: Record<string, number>;
    //     trades: GroupedTrades;
    //   },
    // );

    const prevTrades = this.getTradesFromPreviousPeriod(restFiles);
    // const prevGroupedTrades = this

    const { groupedTrades, accountAtEnd } = this.getTradesBySingleFile(files);

    const trades = mergeDeepWith(concat, prevTrades.trades, groupedTrades);

    const tradeService = new TradeService(this.dealsService, {
      trades,
      leftOvers: accountAtEnd,
    });

    const deals = await tradeService.getDeals();

    return this.getSummary(deals);
  }

  private async handleMultipleReports({
    files,
    fileType,
    stockExchange,
    reportType,
    user,
  }: {
    files: Express.Multer.File[];
    reportType: string;
    stockExchange: StockExchangeType;
    fileType: FileType;
    user: User;
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

    const result = await getReportFunction(
      [...dealsToCalculate, ...sortedReportsByDate.at(0).trades],
      stockExchange,
    );

    const report = await this.saveReport(result, user);

    return report;
  }

  async handleReports(args: {
    files: Express.Multer.File[];
    reportType: string;
    stockExchange: StockExchangeType;
    fileType: FileType;
    user: User;
  }): Promise<DealReport<Deal>> {
    if (args.files.length === 1) {
      return this.handleSingleReport(args);
    } else {
      return this.handleMultipleReports(args);
    }
  }

  async getReports(userId: string): Promise<ReportEntity[]> {
    const report = await this.reportRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['deals', 'deals.purchase', 'deals.sale'],
    });

    return report;
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
