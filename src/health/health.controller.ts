import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthStatus } from './health.status';

@Controller('hc')
export class HealthController {
  @Get()
  @ApiTags('Health check')
  @ApiResponse({ status: 500, description: 'Internal error' })
  check() {
    return {
      status: HealthStatus.Up,
    };
  }
}
