import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report as ReportEntity } from 'src/report/entities/report.entity';
import { DealReport } from './types/interfaces/deal-report.interface';
import { Deal } from './types/interfaces/deal.interface';
import { DealsService } from 'src/deals/deals.service';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class ReportRepositoryService {
  constructor(
    @InjectRepository(ReportEntity)
    private reportRepository: Repository<ReportEntity>,
    private dealsService: DealsService,
  ) {}

  async getReports(userId: User['id']): Promise<ReportEntity[]> {
    const report = await this.reportRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: ['deals', 'deals.purchase', 'deals.sale'],
    });

    return report;
  }

  async saveReport(
    report: DealReport<Deal>,
    user: User,
  ): Promise<ReportEntity> {
    try {
      const deals = await this.dealsService.saveDeals(report.deals, user);

      const newReport = new ReportEntity();

      newReport.total = report.total;
      newReport.totalMilitaryFee = report.totalMilitaryFee;
      newReport.totalTaxFee = report.totalTaxFee;
      newReport.deals = deals;
      newReport.user = user;

      return this.reportRepository.save(newReport);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
