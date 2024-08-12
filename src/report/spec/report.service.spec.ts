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

const mockGetCurrencyExchange = jest.fn().mockResolvedValue({ rate: 44 });

const mockFormatDateForCurrencyExchange = jest.fn();

const mockGroupTradesByTicker = jest.fn();

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

jest.mock('../../normalizeTrades/normalizeTrades.service', () => {
  return {
    NormalizeTradesService: jest.fn().mockImplementation(() => {
      return {
        normalizeTrades: jest.fn(),
        groupTradesByTicker: mockGroupTradesByTicker,
      };
    }),
  };
});

describe('Report Service', () => {
  let currencyExchangeService: CurrencyExchangeService;
  let reportService: ReportService;
  let normalizeTradesService: NormalizeTradesService;

  beforeEach(() => {
    currencyExchangeService = new CurrencyExchangeService();
    normalizeTradesService = new NormalizeTradesService();
    reportService = new ReportService(
      currencyExchangeService,
      normalizeTradesService,
    );

    mockGroupTradesByTicker.mockReturnValue(clone(expectedGroupedTrades));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('service should be defined', () => {
    expect(reportService).toBeDefined();
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
});
