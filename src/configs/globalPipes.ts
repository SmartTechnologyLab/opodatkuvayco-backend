import { INestApplication, ValidationPipe } from '@nestjs/common';

export const globalPipesConfig = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
};
