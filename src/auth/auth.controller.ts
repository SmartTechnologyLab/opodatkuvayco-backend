import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './utils/Guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  getAuth(): string {
    return this.authService.getAuthHello();
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  getUserRedirect() {
    return 'Google redirect';
  }
}
