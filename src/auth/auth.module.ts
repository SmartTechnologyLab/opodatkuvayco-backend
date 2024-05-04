import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './utils/GoogleStrategy';
import { Supabase } from './utils/Supabase';
import { SessionSerilalizer } from './utils/Serializer';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, Supabase, SessionSerilalizer],
})
export class AuthModule {}
