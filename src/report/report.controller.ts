import {
  Controller,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Deal } from './types/interfaces/deal.interface';
import { DealReport } from './types/interfaces/deal-report.interface';
import { ReportDealsDto } from './dto/report-deals.dto';
import { ReportResponse } from './report.response';

@ApiTags('report')
@Controller('report')
export class ReportController {
  constructor(private reportService: ReportService) {}

  @Post('deals')
  @UseInterceptors(FilesInterceptor('file', 10))
  @ApiOperation({ summary: 'Getting deals' })
  @ApiBody({
    description: 'Upload trades report in JSON or XML format to get deals.',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of JSON or XML files containing trade reports',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Returns deals',
    type: ReportResponse,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDeals(
    @Query() reportDealsDto: ReportDealsDto,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<DealReport<Deal>> {
    const { reportType, fileType, stockExchange } = reportDealsDto;

    return this.reportService.handleReports({
      files,
      reportType,
      stockExchange,
      fileType,
    });
  }
}
