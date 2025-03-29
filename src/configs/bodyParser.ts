import { INestApplication } from '@nestjs/common';
import * as bodyParser from 'body-parser';

export const bodyParserConfig = (app: INestApplication) => {
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.text({ type: 'application/xml', limit: '50mb' }));

  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
};
