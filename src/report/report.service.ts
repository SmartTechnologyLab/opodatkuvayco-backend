import { BadRequestException, Injectable } from '@nestjs/common';
import { NormalizeReportsService } from '../normalizeReports/normalizeReports.service';
import { GroupedTrades } from './types/interfaces/trade.interface';
import { DealReport } from './types/interfaces/deal-report.interface';
import { Deal } from './types/interfaces/deal.interface';
import { ReportFromPreviousPeriod } from './types/interfaces/report.interface';
import { MILITARY_FEE, TAX_FEE } from './consts/tax-fee-percentages';
import { DealsService } from '../deals/deals.service';
import { Report as ReportEntity } from 'src/report/entities/report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { StockExchangeEnum } from 'src/normalizeTrades/constants/enums';
import { TradeService } from 'src/trade/trade.service';
import { mergeDeepWith, concat, pipe, map, sort } from 'ramda';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(ReportEntity)
    private reportRepository: Repository<ReportEntity>,
    private normalizeReportsService: NormalizeReportsService,
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

  getTradesReport(file: Express.Multer.File, stockExchange: StockExchangeEnum) {
    const { trades, accountAtStart, accountAtEnd, dateStart } =
      this.normalizeReportsService.getReportByStockExchange(
        file,
        stockExchange,
      );

    const groupedTrades = this.dealsService.groupTradesByTicker(trades);

    return { groupedTrades, accountAtStart, accountAtEnd, dateStart };
  }

  getTradesByMultipleFiles(
    files: Express.Multer.File[],
    stockExchange: StockExchangeEnum,
  ) {
    return pipe(
      map((file: Express.Multer.File) => {
        const { groupedTrades, accountAtStart, accountAtEnd, dateStart } =
          this.getTradesReport(file, stockExchange);

        return { groupedTrades, accountAtStart, accountAtEnd, dateStart };
      }),
      sort(
        (report1, report2) =>
          new Date(report2.dateStart).getTime() -
          new Date(report1.dateStart).getTime(),
      ),
    )(files);
  }

  sortDeals(deals: Deal[]) {
    return sort((a, b) => a.ticker.localeCompare(b.ticker), deals);
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

  getTradesFromPreviousPeriod(
    groupedTrades: GroupedTrades,
    leftOvers?: Record<string, number>,
  ) {
    const tradeService = new TradeService(this.dealsService, {
      trades: groupedTrades,
      leftOvers,
    });

    const trades = tradeService.getTradesFromPreviousPeriod();

    return { trades, leftOvers: tradeService.getLefovers() };
  }

  processTradesFromPreviousPeriod(
    tradeReports: ReportFromPreviousPeriod[],
    baseLeftOvers: Record<string, number>,
  ): { trades: GroupedTrades; leftOvers: Record<string, number> } {
    return tradeReports.reduce(
      (acc, { groupedTrades }, index) => {
        if (index === 0) {
          return this.getTradesFromPreviousPeriod(groupedTrades, baseLeftOvers);
        } else {
          const { trades, leftOvers } = this.getTradesFromPreviousPeriod(
            groupedTrades,
            acc.leftOvers,
          );

          const mergedTrades: GroupedTrades = mergeDeepWith(
            concat,
            trades,
            acc.trades,
          );

          return {
            trades: mergedTrades,
            leftOvers,
          };
        }
      },
      {} as {
        leftOvers: Record<string, number>;
        trades: GroupedTrades;
      },
    );
  }

  async processMultipleFiles({
    files,
    user,
    stockExchange,
  }: {
    files: Express.Multer.File[];
    user: User;
    stockExchange: StockExchangeEnum;
  }) {
    const [firstReport, ...restReports] = this.getTradesByMultipleFiles(
      files,
      stockExchange,
    );

    const tradeService = new TradeService(this.dealsService, {
      trades: firstReport.groupedTrades,
    });

    const leftOvers = tradeService.getNeededTradesFromPreviousPeriod(
      firstReport.groupedTrades,
      firstReport.accountAtStart,
    );

    const prevTrades = this.processTradesFromPreviousPeriod(
      restReports,
      leftOvers,
    );

    if (Object.values(leftOvers).some((value) => value > 0)) {
      throw new BadRequestException('Not enough buy deals');
    }

    tradeService.setTrades(prevTrades.trades);

    const deals = await tradeService.getDeals();

    const report = await this.saveReport(this.getSummary(deals), user);

    return report;
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
