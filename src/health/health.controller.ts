import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from './health.response';
import { HealthStatus } from './health.status';

@Controller('hc')
export class HealthController {
  @Get()
  @ApiTags('Health check')
  @ApiResponse({ type: HealthResponse, description: 'Success', status: 200 })
  @ApiResponse({ status: 500, description: 'Internal error' })
  check(): HealthResponse {
    return {
      status: HealthStatus.Up,
    };
  }
}
