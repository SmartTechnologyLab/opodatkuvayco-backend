import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('registration')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google/login')
  @ApiResponse({
    status: 200,
    description: 'Successfully initiated Google authentication',
    schema: {
      properties: {
        message: { type: 'string', example: 'Google Auth' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Failed to initiate Google authentication',
  })
  async getUserAuth() {
    return this.authService.signInGoogle();
  }

  @Get('logout')
  async getUserLogout() {
    return this.authService.logout();
  }
}
