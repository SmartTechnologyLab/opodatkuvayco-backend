import { IFreedomFinanceReport } from 'src/report/types/freedomFinance';
import { NormalizeReportsService } from '../normalizeReports.service';
import { StockExchange } from '../../normalizeTrades/constants';

describe('Normalize Report Service', () => {
  let normalizeReportsService: NormalizeReportsService;

  beforeEach(() => {
    normalizeReportsService = new NormalizeReportsService();
  });

  describe('getReportByStockExchange should return normalize report', () => {
    it('when stockExchange is freedom finance', () => {
      const freedomFinanceReport: IFreedomFinanceReport = {
        date_start: '2021-01-01',
        trades: {
          detailed: [
            {
              date: '2021-01-01',
              instr_nm: 'AAPL',
              operation: 'buy',
              p: 100,
              q: 1,
              curr_c: 'USD',
              commission: 0,
            },
          ],
        },
        corporate_actions: {
          detailed: [],
        },
      };

      const report = normalizeReportsService.getReportByStockExchange(
        freedomFinanceReport,
        StockExchange.FREEDOM_FINANCE,
      );

      expect(report).toMatchSnapshot();
    });
  });
});
