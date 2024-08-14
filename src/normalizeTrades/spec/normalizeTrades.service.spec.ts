import { NormalizeTradesService } from '../normalizeTrades.service';
import { StockExchange } from '../constants';
import {
  freedomFinanceTrades,
  freedomFinanceTradesWithPreviousPeriods,
} from './__fixtures__/freedomFinance';

describe('Normalize Trades Service', () => {
  let normalizeTradesService: NormalizeTradesService;

  beforeEach(() => {
    normalizeTradesService = new NormalizeTradesService();
  });

  describe('groupTradesByTicker', () => {
    it('method should have been called with certain params', () => {
      const groupTradesByTickerSpy = jest.spyOn(
        normalizeTradesService,
        'groupTradesByTicker',
      );

      normalizeTradesService.groupTradesByTicker(
        freedomFinanceTrades,
        StockExchange.FREEDOM_FINANCE,
      );

      expect(groupTradesByTickerSpy).toHaveBeenCalledWith(
        freedomFinanceTrades,
        StockExchange.FREEDOM_FINANCE,
      );
    });

    it('groups trades by ticker', () => {
      const groupedTrades = normalizeTradesService.groupTradesByTicker(
        freedomFinanceTrades,
        StockExchange.FREEDOM_FINANCE,
      );

      expect(groupedTrades).toMatchSnapshot();
    });
  });

  describe('normalize trades returns trades converted to interface ITrade', () => {
    it('freedom finance trades', () => {
      const normalizedTrades = normalizeTradesService.getNormalizedTrades(
        StockExchange.FREEDOM_FINANCE,
        freedomFinanceTrades,
      );

      expect(normalizedTrades).toMatchSnapshot();
    });
  });

  it('normalized freedom finance trades return trades converted to interface ITrade for IFreedomFinanceTrade', () => {
    const normalizedFreedomFinanceTrades =
      normalizeTradesService.normalizedFreedomFinanceTrades(
        freedomFinanceTradesWithPreviousPeriods,
      );

    expect(normalizedFreedomFinanceTrades).toMatchSnapshot();
  });

  // describe('getReportByStockExchange returns trades by stock exchange', () => {
  //   it('returns trades for freedom finance stock exchange', () => {
  //     const trades = norma.getReportByStockExchange(
  //       {
  //         trades: { detailed: freedomFinanceTrades },
  //       },
  //       StockExchange.FREEDOM_FINANCE,
  //     );

  //     expect(trades).toMatchSnapshot();
  //   });
  // });

  describe('validate if object is already consist of ITrade interface', () => {
    it('returns true if object contains property of ticker', () => {
      const isITrade = normalizeTradesService.isITrade({
        ticker: 'AAPL',
        price: 100,
        commission: 0,
        operation: 'Buy',
        quantity: 10,
        date: '2021-01-01',
        currency: 'USD',
      });

      expect(isITrade).toBeTruthy();
    });

    it('returns false if object contains property of ticker', () => {
      const isITrade = normalizeTradesService.isITrade({
        isnt_nm: 'AAPL',
        price: 100,
        commission: 0,
        operation: 'Buy',
        quantity: 10,
        date: '2021-01-01',
        currency: 'USD',
      });

      expect(isITrade).toBeFalsy();
    });
  });
});
