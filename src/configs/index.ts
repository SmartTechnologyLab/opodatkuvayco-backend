import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { bodyParserConfig } from './bodyParser';
import { globalPipesConfig } from './globalPipes';
import { corsConfig } from './cors';
import { openApiConfig } from './openApi';

export const appConfig = (
  app: INestApplication,
  configService: ConfigService,
) => {
  bodyParserConfig(app);

  globalPipesConfig(app);

  corsConfig(app, configService);

  openApiConfig(app);
};
