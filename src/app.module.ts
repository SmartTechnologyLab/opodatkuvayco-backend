import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { Deal, Trade } from './deals/entities/deals.entity';
import { Report } from './report/entities/report.entity';
import { ReportModule } from './report/report.module';
import { CurrencyRateModule } from './currencyExchange/currencyRate.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService) => ({
        type: configService.get('DB_TYPE'),
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Deal, Trade, Report],
        // TODO: not for production
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ReportModule,
    CurrencyRateModule,
    AuthModule,
    UserModule,
  ],
  controllers: [HealthController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
  ],
})
export class AppModule {}
