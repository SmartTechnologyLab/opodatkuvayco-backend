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
import { NormalizeTradesService } from 'src/normalizeTrades/normalizeTrades.service';
import { ReportReaderService } from 'src/reportReader/reportReader.service';
import { NormalizeReportsService } from 'src/normalizeReports/normalizeReports.service';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(
    private reportService: ReportService,
    private normalizeTrades: NormalizeTradesService,
    private readReportService: ReportReaderService,
    private normalizeReportService: NormalizeReportsService,
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
    description: 'Load trades report in JSON or Xml format for getting deals',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    type: [Report],
  })
  // @UseGuards(JwtGuard)
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
}
