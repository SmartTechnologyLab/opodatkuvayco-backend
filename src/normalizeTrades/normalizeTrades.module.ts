import { Module } from '@nestjs/common';
import { NormalizeTradesService } from './normalizeTrades.service';

@Module({
  providers: [NormalizeTradesService],
})
export class NormalizeTradesModule {}
