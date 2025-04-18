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
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt.quard';
import { Deal } from './types/interfaces/deal.interface';
import { DealReport } from './types/interfaces/deal-report.interface';
import { ReportDealsDto } from './dto/report-deals.dto';
import { Report } from './entities/report.entity';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

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
}
