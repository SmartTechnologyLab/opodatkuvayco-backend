import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { DealsService } from './deals.service';
import { JwtGuard } from 'src/auth/guards/jwt.quard';
import { Deal } from './entities/deals.entity';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('deals')
@Controller('deals')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @UseGuards(JwtGuard)
  @Get('GetDeals')
  @ApiResponse({
    status: 200,
    type: [Deal],
  })
  getDeals(@Request() req: any): Promise<Deal[]> {
    return this.dealsService.getDeals(req.user.id);
  }
}
