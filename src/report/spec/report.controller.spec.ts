import { CurrencyExchangeService } from '../../currencyExchange/currencyExchange.service';
import { ReportController } from '../report.controller';
import { ReportService } from '../report.service';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { trades, tradesNextYear } from './__fixtures__/report';
import {
  resultDeals,
  resultDealsNextYear,
  shortResultDeals,
} from './__fixtures__/resultDeals';
import { INestApplication } from '@nestjs/common';

jest.mock('../../currencyExchange/currencyExchange.service', () => {
  return {
    CurrencyExchangeService: jest.fn().mockImplementation(() => {
      return {
        getCurrencyExchange: jest.fn(),
        formatDateForCurrencyExchange: jest.fn(),
      };
    }),
  };
});

describe('Report Controller', () => {
  let reportService: ReportService;
  let reportController: ReportController;
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        ReportService,
        {
          provide: CurrencyExchangeService,
          useValue: new CurrencyExchangeService(),
        },
      ],
    }).compile();

    reportController = moduleRef.get<ReportController>(ReportController);
    reportService = moduleRef.get<ReportService>(ReportService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();

    if (app) {
      app.close();
    }
  });

  it('report controller should be defined', () => {
    expect(reportController).toBeDefined();
  });

  describe('Post /deals', () => {
    it('should return extended report when query type is "extended"', async () => {
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

      const response = await request(app.getHttpServer())
        .post('/report/deals')
        .query({ type: 'extended' })
        .attach('file', mockFile.buffer, 'report.json');

      expect(response.status).toBe(201);
      expect(response.body).toMatchSnapshot();
    });

    it('when getting two files took the latest by the date as a year for calculate and get prev buys from previous years', async () => {
      const mockFile1 = {
        buffer: Buffer.from(JSON.stringify({ trades: { detailed: trades } })),
      } as Express.Multer.File;

      const mockFile2 = {
        buffer: Buffer.from(
          JSON.stringify({ trades: { detailed: tradesNextYear } }),
        ),
      } as Express.Multer.File;

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

      jest
        .spyOn(reportService, 'getReportExtended')
        .mockResolvedValueOnce(resultDeals)
        .mockResolvedValueOnce(resultDealsNextYear);

      const response = await request(app.getHttpServer())
        .post('/report/deals')
        .query({ type: 'extended' })
        .attach('file', mockFile1.buffer, 'report.json')
        .attach('file', mockFile2.buffer, 'report.json');

      expect(response.body).toMatchSnapshot();
    });

    it('', async () => {
      const mockFile1 = {
        buffer: Buffer.from(
          JSON.stringify({ trades: { detailed: tradesNextYear } }),
        ),
      } as Express.Multer.File;

      jest.spyOn(reportService, 'readReport').mockReturnValue({
        trades: { detailed: tradesNextYear },
        date_start: '2021-04-24 23:59:59',
        corporate_actions: { detailed: [] },
      });

      jest
        .spyOn(reportService, 'getReport')
        .mockResolvedValue(shortResultDeals);

      const response = await request(app.getHttpServer())
        .post('/report/deals')
        .query({ type: '' })
        .attach('file', mockFile1.buffer, 'report.json');

      expect(response.body).toMatchSnapshot();
    });
  });
});
