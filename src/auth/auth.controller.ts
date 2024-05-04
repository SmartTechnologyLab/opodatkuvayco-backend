import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './utils/Guards';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  getAuth() {
    return { message: 'Google Auth' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  getUserRedirect() {
    return { message: 'OK' };
  }

  @Get('status')
  userStatus(@Req() request: Request) {
    if (request.user) {
      return { msg: 'Authenticated' };
    }

    return { msg: 'Not Authenticated' };
  }
}
