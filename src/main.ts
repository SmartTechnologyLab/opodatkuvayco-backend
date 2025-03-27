import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { appConfig } from './configs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  dotenv.config();

  // Get host and port from environment variables
  const host = configService.get<string>('HOST') || '0.0.0.0';
  const port = parseInt(configService.get<string>('PORT'), 10) || 3000;

  appConfig(app, configService);

  const config = new DocumentBuilder()
    .setTitle('Opodatkuvayco Backend')
    .setVersion('1.0')
    .addTag('REST API')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, host);
}

bootstrap();
