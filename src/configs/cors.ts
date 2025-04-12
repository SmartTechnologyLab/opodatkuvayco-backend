import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cors from 'cors';

export const corsConfig = (
  app: INestApplication,
  configService: ConfigService,
) => {
  app.use(
    cors({
      origin: configService.get('CLIENT_URL'),
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    }),
  );
};
