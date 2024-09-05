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
import { StockExchange } from '../normalizeTrades/constants';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('report')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post('deals')
  @UseInterceptors(FilesInterceptor('file', 10))
  @ApiOperation({ summary: 'Getting deals' })
  @ApiQuery({ name: 'type', description: 'Report type', required: false })
  @ApiBody({
    description: 'Loading trades report in JSON format for getting deals',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON file containing trades report',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns deals',
  })
  async getDeals(
    @Query('type') type: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<IDealReport<Deal>> {
    try {
      return this.reportService.handleReports(
        files,
        type,
        StockExchange.FREEDOM_FINANCE,
      );
    } catch (error) {
      throw new Error(error);
    }
  }
}
