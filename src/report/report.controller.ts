import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.quard';
import { Deal } from './types/interfaces/deal.interface';
import { DealReport } from './types/interfaces/deal-report.interface';
import { ReportDealsDto } from './dto/report-deals.dto';
import { Report } from './entities/report.entity';
// import { TradeService } from './trade.service';
import { DealsService } from 'src/deals/deals.service';
import { NormalizeReportsService } from 'src/normalizeReports/normalizeReports.service';
import { ReportReaderService } from 'src/reportReader/reportReader.service';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(
    private reportService: ReportService,
    private normalizeReportService: NormalizeReportsService,
    private dealsService: DealsService,
    private reportReaderService: ReportReaderService,
  ) {}

  @UseGuards(JwtGuard)
  @Get('GetReports')
  @ApiResponse({
    status: 200,
    type: [Report],
  })
  getRepots(@Request() req: any): Promise<Report[]> {
    return this.reportService.getReports(req.user.id);
  }

  @Post('CreateReport')
  @UseInterceptors(FilesInterceptor('file', 10))
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
    type: [Report],
  })
  @UseGuards(JwtGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getReport(
    @Query() reportDealsDto: ReportDealsDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req: any,
  ): Promise<DealReport<Deal>> {
    try {
      const { reportType, fileType, stockExchange } = reportDealsDto;

      return this.reportService.handleReports({
        files,
        reportType,
        stockExchange,
        fileType,
        user: req.user,
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  @Post('Test')
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', 10))
  @UsePipes(new ValidationPipe({ transform: true }))
  async test(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.reportService.proccessSingleFileReport(files);
  }

  @Post('Test-2')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({
    description: 'Upload multiple JSON files containing trades report',
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of JSON files containing trades report',
        },
      },
    },
  })
  async processMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.reportService.processMultipleFiles(files);
  }
}
