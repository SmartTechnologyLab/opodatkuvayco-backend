import { ApiProperty } from '@nestjs/swagger';
import { HealthStatus } from './health.status';

export class HealthResponse {
  @ApiProperty({ enum: HealthStatus })
  readonly status: HealthStatus;
}
