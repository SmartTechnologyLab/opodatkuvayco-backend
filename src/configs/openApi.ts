import { INestApplication } from '@nestjs/common';
import * as basicAuth from 'express-basic-auth';

export const openApiConfig = (app: INestApplication) => {
  app.use(
    '/docs*',
    basicAuth({
      authorizer: (username: string, password: string) =>
        username === process.env.SWAGGER_HTTP_BASIC_AUTH_USERNAME &&
        password === process.env.SWAGGER_HTTP_BASIC_AUTH_PASSWORD,
      challenge: true,
    }),
  );
};
