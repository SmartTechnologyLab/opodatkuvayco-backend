import {
  Controller,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IReport, ITrades } from './types';
import { sortByDate } from './helpers';
import { reverse } from 'ramda';

@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

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

          const deals = await this.reportService.getPrevTrades(
            previousDeals.length
              ? [...previousDeals, ...statement.trades.detailed]
              : statement.trades.detailed,
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
