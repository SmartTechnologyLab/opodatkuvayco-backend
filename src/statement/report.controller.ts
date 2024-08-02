import {
  Controller,
  Get,
  Post,
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
    return JSON.parse(fs.readFileSync(this.filePath22, 'utf-8'));
  }

  @Post('deals')
  @UseInterceptors(FilesInterceptor('file', 10))
  async getDeals(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<ITrades[]> {
    try {
      if (files.length === 1) {
        return this.statementService.calculateDeals(
          this.statementService.readReport(files.at(0)).trades.detailed,
        ) as Promise<ITrades[]>;
      }

      const sortedStatementsByDate: IReport[] = [];
      let dealsToCalculate: ITrades[] = [];

      files.forEach((file) => {
        sortedStatementsByDate.push(this.statementService.readReport(file));
      });

      sortByDate(sortedStatementsByDate);

      await Promise.all(
        sortedStatementsByDate.map(async (statement, index) => {
          if (index !== 0) {
            const deals = await this.statementService.calculateDeals(
              statement.trades.detailed,
              true,
            );

            dealsToCalculate = [...(deals as ITrades[]), ...dealsToCalculate];
          }
        }),
      );

      return this.statementService.calculateDeals(
        [...dealsToCalculate, ...sortedStatementsByDate.at(0).trades.detailed],
        false,
      ) as Promise<ITrades[]>;
    } catch (error) {
      throw new Error(error);
    }
  }
}
