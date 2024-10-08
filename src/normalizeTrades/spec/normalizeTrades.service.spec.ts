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
