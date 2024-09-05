import { CurrencyExchangeService } from '../../currencyExchange/currencyExchange.service';
import { ReportController } from '../report.controller';
import { ReportService } from '../report.service';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { trades } from './__fixtures__/report';
import { resultDeals, shortResultDeals } from './__fixtures__/resultDeals';
import { INestApplication } from '@nestjs/common';
import { NormalizeTradesService } from '../../normalizeTrades/normalizeTrades.service';
import { NormalizeReportsService } from '../../normalizeReports/normalizeReports.service';

jest.mock('../report.service', () => ({
  ReportService: jest.fn().mockImplementation(() => {
    return {
      handleReports: jest.fn(),
    };
  }),
}));

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
        {
          provide: NormalizeTradesService,
          useValue: new NormalizeTradesService(),
        },
        {
          provide: NormalizeReportsService,
          useValue: new NormalizeReportsService(),
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

      jest.spyOn(reportService, 'handleReports').mockResolvedValue(resultDeals);

      const response = await request(app.getHttpServer())
        .post('/report/deals')
        .query({ type: 'extended' })
        .attach('file', mockFile.buffer, 'report.json');

      expect(response.status).toBe(201);
      expect(response.body).toMatchSnapshot();
    });

    it('should return short report when query type is empty', async () => {
      const mockFile = {
        buffer: Buffer.from(JSON.stringify({ trades: { detailed: trades } })),
      } as Express.Multer.File;

      jest
        .spyOn(reportService, 'handleReports')
        .mockResolvedValue(shortResultDeals);

      const response = await request(app.getHttpServer())
        .post('/report/deals')
        .query({ type: '' })
        .attach('file', mockFile.buffer, 'report.json');

      expect(response.body).toMatchSnapshot();
    });
  });
});
