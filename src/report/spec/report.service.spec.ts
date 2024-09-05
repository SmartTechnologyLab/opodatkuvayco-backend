import { ReportService } from '../report.service';
import { CurrencyExchangeService } from '../../currencyExchange/currencyExchange.service';
import { trades, tradesNextYear } from './__fixtures__/report';
import {
  expectedGroupedTrades,
  groupedDealsToBeRejected,
} from './__fixtures__/dealsExtended';
import { Deal, IDealReport, ITrade } from '../types';
import { NormalizeTradesService } from '../../normalizeTrades/normalizeTrades.service';
import { StockExchange } from '../../normalizeTrades/constants';
import { clone } from 'ramda';
import { resultDeals, resultDealsNextYear } from './__fixtures__/resultDeals';
import { NormalizeReportsService } from '../../normalizeReports/normalizeReports.service';

const mockGetCurrencyExchange = jest.fn();

const mockFormatDateForCurrencyExchange = jest.fn();

const mockGroupTradesByTicker = jest.fn();

const mockGetReportByStockExchange = jest.fn();

jest.mock('../../currencyExchange/currencyExchange.service', () => ({
  CurrencyExchangeService: jest.fn().mockImplementation(() => {
    return {
      getCurrencyExchange: mockGetCurrencyExchange,
      formatDateForCurrencyExchange: mockFormatDateForCurrencyExchange,
    };
  }),
}));

jest.mock('../../normalizeTrades/normalizeTrades.service', () => ({
  NormalizeTradesService: jest.fn().mockImplementation(() => {
    return {
      normalizeTrades: jest.fn(),
      groupTradesByTicker: mockGroupTradesByTicker,
    };
  }),
}));

describe('Report Service', () => {
  let currencyExchangeService: CurrencyExchangeService;
  let reportService: ReportService;
  let normalizeTradesService: NormalizeTradesService;
  let normalizeReportsService: NormalizeReportsService;

  beforeEach(() => {
    currencyExchangeService = new CurrencyExchangeService();
    normalizeTradesService = new NormalizeTradesService();
    normalizeReportsService = new NormalizeReportsService();

    reportService = new ReportService(
      currencyExchangeService,
      normalizeTradesService,
      normalizeReportsService,
    );

    mockGroupTradesByTicker.mockReturnValue(clone(expectedGroupedTrades));

    mockGetCurrencyExchange.mockResolvedValue({ rate: 44 });

    mockGetReportByStockExchange.mockReturnValue({
      trades: trades,
      dateStart: '3131',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('report extended', () => {
    it('calculated deals', async () => {
      const TOTAL = -2790.19;
      const TAXES = 0;

      const dealsExtended = (await reportService.getReportExtended(
        trades,
        StockExchange.FREEDOM_FINANCE,
      )) as IDealReport<Deal>;

      expect(dealsExtended.deals).toHaveLength(8);

      expect(+dealsExtended.total.toFixed(2)).toEqual(TOTAL);

      expect(dealsExtended.totalMilitaryFee).toEqual(TAXES);

      expect(dealsExtended.totalMilitaryFee).toEqual(TAXES);
    });

    it('returns object with certain keys', async () => {
      const dealsExtended = (await reportService.getReportExtended(
        trades,
        StockExchange.FREEDOM_FINANCE,
      )) as IDealReport<Deal>;

      expect(Object.keys(dealsExtended).length).toEqual(4);
    });

    it('throw an error when trade with operation sell is left', async () => {
      mockGroupTradesByTicker.mockReturnValue(groupedDealsToBeRejected);

      await expect(async () => {
        await reportService.getReportExtended(
          tradesNextYear,
          StockExchange.FREEDOM_FINANCE,
        );
      }).rejects.toThrow('Not enough buy deals');
    });
  });

  describe('getPrevTrades', () => {
    it('return not sold trades from past years', async () => {
      const prevTrades = await reportService.getPrevTrades(
        trades,
        StockExchange.FREEDOM_FINANCE,
      );

      expect(prevTrades).toHaveLength(1);
      expect(prevTrades).toMatchSnapshot();
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
      const trade: ITrade = {
        date: '2021-06-07 11:48:21',
        ticker: 'FIPO',
        operation: 'buy',
        price: 35.53,
        currency: 'USD',
        quantity: 13,
        commission: 2.31,
      };

      const founDeal = reportService?.findDealByDateAndPrice(
        expectedGroupedTrades.FIPO,
        trade,
      );

      expect(founDeal).toEqual(trade);
    });

    describe('getReport', () => {
      it('returns deals that is summed by ticker', async () => {
        mockGroupTradesByTicker.mockReturnValue(expectedGroupedTrades);

        const report = await reportService.getReport(
          trades,
          StockExchange.FREEDOM_FINANCE,
        );

        expect(Object.keys(report).length).toEqual(4);
        expect(report).toMatchSnapshot();
      });
    });

    it('founds deal when date and price is equal', () => {
      const trade: ITrade = {
        date: '2021-06-07 11:48:21',
        ticker: 'FIPO',
        operation: 'buy',
        price: 100.53,
        currency: 'USD',
        quantity: 13,
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
    const purchaseTrade: ITrade = {
      date: '2021-06-07 11:48:21',
      ticker: 'FIPO',
      operation: 'buy',
      price: 100.53,
      currency: 'USD',
      quantity: 13,
      commission: 2.31,
    };

    const sellTrade: ITrade = {
      date: '2021-06-07 11:48:21',
      ticker: 'FIPO',
      operation: 'sell',
      price: 100.53,
      currency: 'USD',
      quantity: 13,
      commission: 2.31,
    };

    it('when params are setted', async () => {
      const RATE = 44;

      const rates = await reportService.fetchPurchaseAndSellRate(
        purchaseTrade,
        sellTrade,
      );

      expect(mockGetCurrencyExchange).toHaveBeenCalledWith(
        purchaseTrade.currency,
        purchaseTrade.date,
      );

      expect(mockGetCurrencyExchange).toHaveBeenCalledWith(
        sellTrade.currency,
        sellTrade.date,
      );

      expect(mockGetCurrencyExchange).toHaveBeenCalledTimes(2);
      expect(rates).toEqual([RATE, RATE]);
    });
  });

  describe('handleReports', () => {
    it('returns report when arguments passed', async () => {
      jest.spyOn(reportService, 'readReport').mockReturnValue({
        trades: { detailed: trades },
        date_start: '3131',
        corporate_actions: { detailed: [] },
      });

      jest
        .spyOn(normalizeReportsService, 'getReportByStockExchange')
        .mockReturnValue({
          dateStart: '3131',
          trades: trades,
        });

      const mockFile = {
        buffer: Buffer.from(JSON.stringify({ trades: { detailed: trades } })),
      } as Express.Multer.File;

      jest
        .spyOn(reportService, 'getReportExtended')
        .mockResolvedValue(resultDeals);

      const report = await reportService.handleReports(
        [mockFile],
        'extended',
        StockExchange.FREEDOM_FINANCE,
      );

      expect(report).toMatchSnapshot();
    });

    it('takes trades that were not sold from previous period to new one', async () => {
      jest
        .spyOn(reportService, 'readReport')
        .mockReturnValueOnce({
          trades: { detailed: trades },
          date_start: '2021-04-24 23:59:59',
          corporate_actions: { detailed: [] },
        })
        .mockReturnValue({
          trades: { detailed: tradesNextYear },
          date_start: '2022-04-24 23:59:59',
          corporate_actions: { detailed: [] },
        });

      jest.spyOn(reportService, 'getPrevTrades').mockResolvedValue(trades);

      jest
        .spyOn(reportService, 'getReportExtended')
        .mockResolvedValueOnce(resultDealsNextYear);

      const report2021 = {
        buffer: Buffer.from(JSON.stringify({ trades: { detailed: trades } })),
      } as Express.Multer.File;

      const report2022 = {
        buffer: Buffer.from(
          JSON.stringify({ trades: { detailed: tradesNextYear } }),
        ),
      } as Express.Multer.File;

      const report = await reportService.handleReports(
        [report2021, report2022],
        'extended',
        StockExchange.FREEDOM_FINANCE,
      );

      expect(report).toMatchSnapshot();
    });

    it('when reportType is empty it should return short deals', async () => {
      const mockFile = {
        buffer: Buffer.from(JSON.stringify({ trades: { detailed: trades } })),
      } as Express.Multer.File;

      jest.spyOn(reportService, 'readReport').mockReturnValue({
        trades: { detailed: trades },
        date_start: '3131',
        corporate_actions: { detailed: [] },
      });

      jest
        .spyOn(reportService, 'getReportExtended')
        .mockResolvedValue(resultDeals);

      const report = await reportService.handleReports(
        [mockFile],
        '',
        StockExchange.FREEDOM_FINANCE,
      );

      expect(report).toMatchSnapshot();
    });
  });
});
