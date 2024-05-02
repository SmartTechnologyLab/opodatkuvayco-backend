import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google/login')
  getAuth(): string {
    return this.authService.getAuthHello();
  }

  @Get('google/redirect')
  getUserRedirect() {
    return 'Google redirect';
  }
}
