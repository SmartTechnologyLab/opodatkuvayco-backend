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

@Controller('report')
export class ReportController {
  constructor(private statementService: ReportService) {}

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
      if (files.length === 1) {
        if (type === 'extended') {
          return this.statementService.getReportExtended(
            this.statementService.readReport(files.at(0)).trades.detailed,
            false,
          ) as Promise<ITrades[]>;
        } else {
          return this.statementService.getReport(
            this.statementService.readReport(files.at(0)).trades.detailed,
          );
        }
      }

      const sortedStatementsByDate: IReport[] = [];
      const dealsToCalculate: ITrades[] = [];

      files.forEach((file) => {
        sortedStatementsByDate.push(this.statementService.readReport(file));
      });

      sortByDate(sortedStatementsByDate);

      const remainedDealsMap = new Map<number, ITrades[]>();

      for (const [indx, statement] of Object.entries(
        sortedStatementsByDate.reverse(),
      )) {
        const index = +indx;

        if (index !== sortedStatementsByDate.length - 1) {
          const previousDeals = remainedDealsMap.get(index - 1) || [];

          const deals = await this.statementService.getReportExtended(
            previousDeals.length
              ? [...previousDeals, ...statement.trades.detailed]
              : statement.trades.detailed,
            true,
          );

          if (!remainedDealsMap.has(index)) {
            remainedDealsMap.set(index, []);
          }

          remainedDealsMap.get(index)?.push(...(deals as ITrades[]));

          if (index === sortedStatementsByDate.length - 2) {
            dealsToCalculate.push(...(deals as ITrades[]));
          }
        }
      }

      return this.statementService.getReportExtended(
        [
          ...dealsToCalculate,
          ...sortedStatementsByDate.reverse().at(0).trades.detailed,
        ],
        false,
      ) as Promise<ITrades[]>;
    } catch (error) {
      throw new Error(error);
    }
  }
}
