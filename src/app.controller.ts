import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Test endpoint')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('test')
  @ApiResponse({
    status: 200,
    description: 'Test endpoint',
    schema: {
      example: 'Hello world',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
