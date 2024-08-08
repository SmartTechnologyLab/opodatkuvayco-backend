import { ReportService } from '../report.service';
import { CurrencyExchangeService } from '../../currencyExchange/currencyExchange.service';
import { trades, tradesNextYear } from './__fixtures__/report';
import { expectedGroupedTrades } from './__fixtures__/dealsExtended';
import { Deal, IDealReport, ITrades } from '../types';

const mockGetCurrencyExchange = jest.fn().mockResolvedValue({ rate: 44 });
const mockFormatDateForCurrencyExchange = jest.fn();

jest.mock('../../currencyExchange/currencyExchange.service', () => {
  return {
    CurrencyExchangeService: jest.fn().mockImplementation(() => {
      return {
        getCurrencyExchange: mockGetCurrencyExchange,
        formatDateForCurrencyExchange: mockFormatDateForCurrencyExchange,
      };
    }),
  };
});

describe('Report Service', () => {
  let currencyExchangeService: CurrencyExchangeService;
  let reportService: ReportService;

  beforeEach(() => {
    currencyExchangeService = new CurrencyExchangeService();
    reportService = new ReportService(currencyExchangeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('service should be defined', () => {
    expect(reportService).toBeDefined();
  });

  describe('group trades by ticker', () => {
    it('group trades by ticker', () => {
      const groupedTrades = reportService.groupTradesByTicker(trades);

      expect(groupedTrades).toMatchSnapshot();
    });

    it('ticker not contains extra signs', () => {
      const groupedTrades = reportService.groupTradesByTicker(trades);

      expect(Object.keys(groupedTrades)).toHaveLength(
        Object.keys(expectedGroupedTrades).length,
      );

      Object.entries(groupedTrades).forEach(([, trades]) => {
        trades.forEach((trade) => {
          expect(trade.instr_nm).not.toContain('.');
        });
      });
    });
  });

  describe('report extended', () => {
    it('calculated deals', async () => {
      const TOTAL = -2834.19;
      const TAXES = 0;

      const dealsExtended = (await reportService.getReportExtended(
        trades,
      )) as IDealReport<Deal>;

      expect(dealsExtended.deals).toHaveLength(8);

      expect(+dealsExtended.total.toFixed(2)).toEqual(TOTAL);

      expect(dealsExtended.totalMilitaryFee).toEqual(TAXES);

      expect(dealsExtended.totalMilitaryFee).toEqual(TAXES);
    });

    it('returns object with certain keys', async () => {
      const dealsExtended = (await reportService.getReportExtended(
        trades,
      )) as IDealReport<Deal>;

      expect(Object.keys(dealsExtended).length).toEqual(4);
    });

    it('throw an error when trade with operation sell is left', async () => {
      await expect(async () => {
        await reportService.getReportExtended(tradesNextYear);
      }).rejects.toThrow('Not enough buy deals');
    });

    it('setting isPrevDeal to true returns trades that were not sold', async () => {
      const remainedDeals = (await reportService.getPrevTrades(
        trades,
      )) as ITrades[];

      expect(remainedDeals).toMatchSnapshot();
      expect(remainedDeals).toHaveLength(1);
      expect(Array.isArray(remainedDeals)).toBeTruthy();
    });
  });

  describe('getReport', () => {
    it('returns deals that is summed by ticker', async () => {
      const report = await reportService.getReport(trades);

      expect(Object.keys(report).length).toEqual(4);
      expect(report).toMatchSnapshot();
    });
  });

  describe('getTotalTaxFee', () => {
    it('when total is less than 0 - return 0', () => {
      const TOTAL = -10;

      const taxFee = reportService.getTotalTaxFee(TOTAL);

      expect(taxFee).toStrictEqual(0);
    });

    it('when total is more than 0 - return 0.18% of total', () => {
      const TOTAL = 1000;
      const FEE = 0.18;

      const taxFee = reportService.getTotalTaxFee(1000);

      expect(taxFee).toStrictEqual(TOTAL * FEE);
    });
  });

  describe('getMilitaryFee', () => {
    it('when total is less than 0 - return 0', () => {
      const TOTAL = -10;

      const taxFee = reportService.getMilitaryFee(TOTAL);

      expect(taxFee).toStrictEqual(0);
    });

    it('when total is more than 0 - return 0.015% of total', () => {
      const TOTAL = 1000;
      const FEE = 0.015;

      const taxFee = reportService.getMilitaryFee(1000);

      expect(taxFee).toStrictEqual(TOTAL * FEE);
    });
  });

  describe('find deal by date and price', () => {
    beforeEach(() => {
      mockFormatDateForCurrencyExchange.mockReturnValue('20210607');
    });

    it('founds deal when date and price is equal', () => {
      const trade: ITrades = {
        date: '2021-06-07 11:48:21',
        instr_nm: 'FIPO',
        operation: 'buy',
        p: 35.53,
        curr_c: 'USD',
        q: 13,
        summ: 461.89,
        commission: 2.31,
      };

      const founDeal = reportService?.findDealByDateAndPrice(
        expectedGroupedTrades.FIPO,
        trade,
      );

      expect(founDeal).toEqual(trade);
    });

    it('founds deal when date and price is equal', () => {
      const trade: ITrades = {
        date: '2021-06-07 11:48:21',
        instr_nm: 'FIPO',
        operation: 'buy',
        p: 100.53,
        curr_c: 'USD',
        q: 13,
        summ: 461.89,
        commission: 2.31,
      };

      const foundDeal = reportService?.findDealByDateAndPrice(
        expectedGroupedTrades.FIPO,
        trade,
      );

      expect(foundDeal).not.toEqual(trade);
    });
  });

  describe('fetch purchase and sell rate', () => {
    const purchaseTrade: ITrades = {
      date: '2021-06-07 11:48:21',
      instr_nm: 'FIPO',
      operation: 'buy',
      p: 100.53,
      curr_c: 'USD',
      q: 13,
      summ: 461.89,
      commission: 2.31,
    };

    const sellTrade: ITrades = {
      date: '2021-06-07 11:48:21',
      instr_nm: 'FIPO',
      operation: 'sell',
      p: 100.53,
      curr_c: 'USD',
      q: 13,
      summ: 461.89,
      commission: 2.31,
    };

    it('when params are setted', async () => {
      const RATE = 44;

      const rates = await reportService.fetchPurchaseAndSellRate(
        purchaseTrade,
        sellTrade,
      );

      expect(mockGetCurrencyExchange).toHaveBeenCalledWith(
        purchaseTrade.curr_c,
        purchaseTrade.date,
      );

      expect(mockGetCurrencyExchange).toHaveBeenCalledWith(
        sellTrade.curr_c,
        sellTrade.date,
      );

      expect(mockGetCurrencyExchange).toHaveBeenCalledTimes(2);
      expect(rates).toEqual([RATE, RATE]);
    });
  });
});
