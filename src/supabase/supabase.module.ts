import { Module } from '@nestjs/common';
import { SuperbaseService } from './supabase.service';

@Module({
  providers: [SuperbaseService],
  exports: [SuperbaseService],
})
export class SupabaseModule {}
