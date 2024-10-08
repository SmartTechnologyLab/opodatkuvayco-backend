import { BadRequestException, Injectable } from '@nestjs/common';
import { clone, reverse, groupBy } from 'ramda';
import { CurrencyExchangeService } from '../currencyExchange/currencyExchange.service';
import {
  Deal,
  DealOptions,
  ITrade,
  IDealReport,
  IReport,
  IReportService,
} from './types';
import { sortByDate } from './helpers';
import { StockExchange } from '../normalizeTrades/constants';
import { IFreedomFinanceCorporateAction } from './types/freedomFinance';
import { NormalizeReportsService } from '../normalizeReports/normalizeReports.service';

@Injectable()
export class ReportService implements IReportService {
  constructor(
    private currencyExchangeService: CurrencyExchangeService,
    private normalizeReportsService: NormalizeReportsService,
  ) {}

  readReport(file: Express.Multer.File) {
    try {
      const reportContent = file.buffer.toString('utf-8');
      return JSON.parse(reportContent);
    } catch (error) {
      throw new Error(error);
    }
  }

  groupTradesByTicker(trades: ITrade[]): Record<ITrade['ticker'], ITrade[]> {
    return groupBy((deal: ITrade) => {
      const ticker = deal.ticker.split('.').at(0);

      return ticker;
    }, trades);
  }

  async getReportExtended(trades: ITrade[]): Promise<IDealReport<Deal>> {
    const deals: Deal[] = [];

    const groupedTrades = this.groupTradesByTicker(clone(trades));

    for (const ticker in groupedTrades) {
      let buyQueue: ITrade[] = [];
      let sellComission = 0;
      for (const deal of groupedTrades[ticker]) {
        if (deal.operation === 'buy' && deal.quantity > 0) {
          const existingDeal = this.findDealByDateAndPrice(buyQueue, deal);
          if (existingDeal) {
            existingDeal.quantity += deal.quantity;
            existingDeal.commission += deal.commission;
          } else {
            buyQueue.push(deal);
          }
        } else if (deal.operation === 'sell' && buyQueue.length > 0) {
          sellComission = deal.commission / deal.quantity;

          for (const purchaseDeal of buyQueue) {
            if (deal.quantity > 0 && purchaseDeal.quantity > 0) {
              const newDeal = await this.setDeal(
                purchaseDeal,
                deal,
                sellComission,
              );

              deals.push(newDeal);
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
              const newDeal = await this.setDeal(
                foundShortBuy,
                deal,
                sellComission,
              );

              deals.push(newDeal);
            }
          }
        } else if (
          deal.operation === 'sell' &&
          buyQueue.length === 0 &&
          this.getShortBuy(groupedTrades[ticker], deal)
        ) {
          sellComission = deal.commission / deal.quantity;

          const foundShortBuy = this.getShortBuy(groupedTrades[ticker], deal);

          if (foundShortBuy) {
            const newDeal = await this.setDeal(
              foundShortBuy,
              deal,
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

  async getPrevTrades(trades: ITrade[]): Promise<ITrade[]> {
    const remainedPurchaseDeals: ITrade[] = [];

    const groupedTrades = this.groupTradesByTicker(clone(trades));

    for (const ticker in groupedTrades) {
      let buyQueue: ITrade[] = [];
      for (const deal of groupedTrades[ticker]) {
        if (deal.operation === 'buy' && deal.quantity > 0) {
          const existingDeal = this.findDealByDateAndPrice(buyQueue, deal);
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

  async getReport(report: ITrade[]): Promise<IDealReport<Deal>> {
    const trades = (await this.getReportExtended(report)) as IDealReport<Deal>;

    const deals = Object.values(
      trades.deals.reduce(
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
      total: trades.total,
      totalTaxFee: trades.totalTaxFee,
      totalMilitaryFee: trades.totalMilitaryFee,
      deals,
    };
  }

  getShortBuy(trades: ITrade[], currentSellTrade: ITrade) {
    return trades.find(
      (trade, indx) =>
        trade.operation === 'buy' &&
        trade.quantity > 0 &&
        indx > trades.indexOf(currentSellTrade),
    );
  }

  async setDeal(
    purchaseDeal: ITrade,
    sellDeal: ITrade,
    sellComission?: number,
  ): Promise<Deal> {
    const [purchaseRate, saleRate] = await this.fetchPurchaseAndSellRate(
      purchaseDeal,
      sellDeal,
    );

    const quantityToProcess = Math.min(
      purchaseDeal.quantity,
      sellDeal.quantity,
    );

    const deal = this.getDeal({
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

  async handleReports(
    files: Express.Multer.File[],
    reportType: string,
    stockExchange: StockExchange,
  ): Promise<IDealReport<Deal>> {
    const getReportFunction: (
      trades: ITrade[],
      stockExchange: StockExchange,
    ) => Promise<IDealReport<Deal>> =
      reportType === 'extended'
        ? this.getReportExtended.bind(this)
        : this.getReport.bind(this);

    if (files.length === 1) {
      const report = this.readReport(files.at(0));

      const { trades } = this.normalizeReportsService.getReportByStockExchange(
        report,
        stockExchange,
      );

      return getReportFunction(trades, stockExchange);
    }

    const reports: IReport<ITrade>[] = [];
    const dealsToCalculate: ITrade[] = [];

    files.forEach((file) => {
      const report = this.readReport(file);

      reports.push(
        this.normalizeReportsService.getReportByStockExchange(
          report,
          stockExchange,
        ) as IReport<ITrade>,
      );
    });

    const sortedReportsByDate: IReport<ITrade>[] = sortByDate(reports);

    const reversedReports: IReport<ITrade>[] = reverse(sortedReportsByDate);

    const remainedDealsMap = new Map<number, ITrade[]>();

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

  async fetchPurchaseAndSellRate(
    purchaseDeal: ITrade,
    sellDeal: ITrade,
  ): Promise<[number, number]> {
    const [{ rate: purchaseRate }, { rate: sellRate }] = await Promise.all([
      this.currencyExchangeService.getCurrencyExchange(
        purchaseDeal.currency,
        purchaseDeal.date,
      ),

      this.currencyExchangeService.getCurrencyExchange(
        sellDeal.currency,
        sellDeal.date,
      ),
    ]);

    return [purchaseRate, sellRate];
  }

  findDealByDateAndPrice(deals: ITrade[], currentDeal: ITrade) {
    return deals.find(
      (deal) =>
        this.currencyExchangeService.formatDateForCurrencyExchange(
          deal.date,
        ) ===
          this.currencyExchangeService.formatDateForCurrencyExchange(
            currentDeal.date,
          ) && deal.price === currentDeal.price,
    );
  }

  getTotalTaxFee(total: number) {
    if (total <= 0) {
      return 0;
    }

    return total * 0.18;
  }

  getMilitaryFee(total: number) {
    if (total <= 0) {
      return 0;
    }

    return total * 0.015;
  }

  getDeal({
    ticker,
    quantity,
    purchaseCommission,
    purchaseDate,
    purchasePrice,
    purchaseRate,
    saleCommission,
    saleDate,
    salePrice,
    saleRate,
  }: DealOptions = {}) {
    const purchaseSum = purchasePrice * quantity;
    const _purchaseCommission = purchaseCommission || purchaseSum;
    const saleSum = salePrice * quantity;
    const _saleCommission = saleCommission || saleSum;
    const purchaseUah =
      (purchaseSum + _purchaseCommission) * purchaseRate +
      _saleCommission * saleRate;
    const saleUah = saleSum * saleRate;

    return {
      id: Symbol(),
      purchase: {
        commission: _purchaseCommission,
        date: purchaseDate,
        price: purchasePrice,
        rate: purchaseRate,
        sum: purchaseSum,
        uah: purchaseUah,
      },
      quantity: quantity,
      sale: {
        commission: _saleCommission,
        date: saleDate,
        price: salePrice,
        rate: saleRate,
        sum: saleSum,
        uah: saleUah,
      },
      ticker: ticker,
      total: saleUah - purchaseUah,
      percent: saleUah / purchaseUah - 1,
    };
  }

  async calculateDividends(file: Express.Multer.File) {
    const corporateActions = this.readReport(file).corporate_actions
      .detailed as IFreedomFinanceCorporateAction[];

    const filteredActionsByDividend = corporateActions.filter(
      (action) => action.type_id === 'dividend',
    );

    const dividends = await Promise.all(
      filteredActionsByDividend.map(async (dividend) => {
        const { rate } = await this.currencyExchangeService.getCurrencyExchange(
          dividend.currency,
          dividend.date,
        );

        return {
          ticker: dividend.ticker,
          rate,
          price: dividend.amount,
          uah: dividend.amount * rate,
        };
      }),
    );

    const totalDividends = dividends.reduce(
      (acc, dividend) => acc + dividend.uah,
      0,
    );

    return {
      total: {
        sumUAH: totalDividends,
        taxFee: totalDividends * 0.09,
        militaryFee: totalDividends * 0.015,
      },
      dividendsResult: dividends,
    };
  }
}
