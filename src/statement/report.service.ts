import { Injectable } from '@nestjs/common';
import { CurrencyExchangeService } from 'src/currencyExchange/currencyExchange.service';
import { Deal, DealOptions, ICorporateAction, IReport, ITrades } from './types';

@Injectable()
export class ReportService {
  constructor(private currencyExchangeService: CurrencyExchangeService) {}

  readReport(file: Express.Multer.File): IReport {
    try {
      const reportContent = file.buffer.toString('utf-8');
      return JSON.parse(reportContent);
    } catch (error) {
      throw new Error(error);
    }
  }

  groupDealsByTicker(deals: ITrades[]): { [key: string]: ITrades[] } {
    const groupedDeals: { [key: string]: ITrades[] } = {};

    deals.forEach((deal) => {
      let ticker = deal.instr_nm;

      if (ticker?.endsWith('.BLOCKED')) {
        ticker = ticker?.replace('.BLOCKED', '');
      }

      if (groupedDeals[ticker]) {
        groupedDeals[ticker].push(deal);
      } else {
        groupedDeals[ticker] = [deal];
      }
    });

    return groupedDeals;
  }

  async calculateDeals(report: ITrades[], isPrevDeal?: boolean) {
    const deals: Deal[] = [];
    const remainedPurchaseDeals: ITrades[] = [];

    const groupedDeals = this.groupDealsByTicker(report);

    for (const ticker in groupedDeals) {
      let buyQueue: ITrades[] = [];

      for (const deal of groupedDeals[ticker]) {
        if (deal.operation === 'buy') {
          const existingDeal = this.findDealByDateAndPrice(buyQueue, deal);
          if (existingDeal) {
            existingDeal.q += deal.q;
            existingDeal.commission += deal.commission;
          } else {
            buyQueue.push(deal);
          }
        } else if (deal.operation === 'sell' && buyQueue.length > 0) {
          for (const purchaseDeal of buyQueue) {
            if (deal.q >= purchaseDeal.q) {
              const [{ rate: purchaseRate }, { rate: saleRate }] =
                await Promise.all([
                  !isPrevDeal &&
                    this.currencyExchangeService.getCurrencyExchange(
                      purchaseDeal.curr_c,
                      purchaseDeal.date,
                    ),
                  !isPrevDeal &&
                    this.currencyExchangeService.getCurrencyExchange(
                      deal.curr_c,
                      deal.date,
                    ),
                ]);

              deals.push(
                this.getDeal({
                  ticker,
                  purchaseCommission: purchaseDeal.commission,
                  purchaseDate: new Date(purchaseDeal.date),
                  purchaseRate,
                  purchasePrice: purchaseDeal.p,
                  quantity: purchaseDeal.q,
                  saleCommission: deal.commission,
                  saleDate: new Date(deal.date),
                  saleRate,
                  salePrice: deal.p,
                }),
              );

              deal.q -= purchaseDeal.q;
              purchaseDeal.q = 0;
            }
          }

          buyQueue = buyQueue.filter((purchaseDeal) => purchaseDeal.q > 0);
        }
      }
      remainedPurchaseDeals.push(...buyQueue);
    }

    const total = deals.reduce((acc, deal) => acc + deal.total, 0);

    const totalTaxFee = this.getTotalTaxFee(total);

    const totalMilitaryFee = this.getMilitaryFee(total);

    return isPrevDeal
      ? remainedPurchaseDeals
      : {
          length: deals.length,
          total,
          totalTaxFee,
          totalMilitaryFee,
          deals: deals.sort((a, b) => a.ticker.localeCompare(b.ticker)),
        };
  }

  findDealByDateAndPrice(deals: ITrades[], currentDeal: ITrades) {
    return deals.find(
      (deal) =>
        this.currencyExchangeService.formatDateForCurrencyExchange(
          deal.date,
        ) ===
          this.currencyExchangeService.formatDateForCurrencyExchange(
            currentDeal.date,
          ) && deal.p === currentDeal.p,
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
      .detailed as ICorporateAction[];

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
