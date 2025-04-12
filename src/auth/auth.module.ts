import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy, RefreshTokenStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { RefreshGuard } from './guards/refresh.guard';
import { GoogleOAuthStrategy } from './strategies/google.strategy';
import { GoogleGuard } from './guards/google.guard';
import { Jwt2faAuthGuard } from './guards/jwt-2fa.guard';
import { Jwt2faStrategy } from './strategies/jwt-2fa.strategy';
import { MailModule } from 'src/mail/mail.module';
import { LocalGuard } from './guards/local.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    RefreshGuard,
    GoogleOAuthStrategy,
    GoogleGuard,
    LocalGuard,
    Jwt2faAuthGuard,
    Jwt2faStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
