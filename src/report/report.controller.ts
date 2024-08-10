import {
  Controller,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Deal, IDealReport } from './types';

@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post('deals')
  @UseInterceptors(FilesInterceptor('file', 10))
  async getDeals(
    @Query('type') type: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<IDealReport<Deal>> {
    try {
      return this.reportService.handleReports(files, type);
    } catch (error) {
      throw new Error(error);
    }
  }
}
