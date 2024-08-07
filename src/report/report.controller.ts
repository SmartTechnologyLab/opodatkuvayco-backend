import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IReport, ITrades } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { sortByDate } from './helpers';
import { reverse } from 'ramda';

@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  private filePath21 = path.join(__dirname, '..', '..', '21.json');
  private filePath22 = path.join(__dirname, '..', '..', '22.json');
  private filePath23 = path.join(__dirname, '..', '..', '23.json');

  @Get('test')
  async test() {
    return JSON.parse(fs.readFileSync(this.filePath21, 'utf-8'));
  }

  @Post('deals')
  @UseInterceptors(FilesInterceptor('file', 10))
  async getDeals(
    @Query('type') type: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      const getReportFunction =
        type === 'extended'
          ? this.reportService.getReportExtended.bind(this.reportService)
          : this.reportService.getReport.bind(this.reportService);

      if (files.length === 1) {
        return getReportFunction(
          this.reportService.readReport(files.at(0)).trades.detailed,
          false,
        ) as Promise<ITrades[]>;
      }

      const reports: IReport[] = [];
      const dealsToCalculate: ITrades[] = [];

      files.forEach((file) => {
        reports.push(this.reportService.readReport(file));
      });

      const sortedReportsByDate = sortByDate(reports);

      const reversedReports: IReport[] = reverse(sortedReportsByDate);

      const remainedDealsMap = new Map<number, ITrades[]>();

      for (const [indx, statement] of Object.entries(reversedReports)) {
        const index = +indx;

        if (index !== sortedReportsByDate.length - 1) {
          const previousDeals = remainedDealsMap.get(index - 1) || [];

          const deals = await getReportFunction(
            previousDeals.length
              ? [...previousDeals, ...statement.trades.detailed]
              : statement.trades.detailed,
            true,
          );

          if (!remainedDealsMap.has(index)) {
            remainedDealsMap.set(index, []);
          }

          if ((deals as ITrades[]).length) {
            remainedDealsMap.get(index)?.push(...(deals as ITrades[]));
          }

          if (
            index === sortedReportsByDate.length - 2 &&
            (deals as ITrades[]).length
          ) {
            dealsToCalculate.push(...(deals as ITrades[]));
          }
        }
      }

      return getReportFunction(
        [...dealsToCalculate, ...sortedReportsByDate.at(0).trades.detailed],
        false,
      ) as Promise<ITrades[]>;
    } catch (error) {
      throw new Error(error);
    }
  }
}
