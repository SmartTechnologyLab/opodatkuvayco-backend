import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Patch,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from './guards/jwt.quard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { RefreshGuard } from './guards/refresh.guard';
import { RefreshDto } from './dto/refresh.dto';
import { GoogleGuard } from './guards/google.guard';
import { UserRequest } from './types/userRequest';
import { Auth2FADto } from './dto/auth2fa.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiBody({
    type: LoginDto,
  })
  @UseGuards(LocalGuard)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @ApiBody({
    type: RegisterDto,
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  async refresh(@Body() refreshDto: RefreshDto) {
    const tokens = await this.authService.refreshToken(refreshDto.refreshToken);
    return tokens;
  }

  @Get('confirm-email')
  async confirmEmail(@Res() res: Response, @Query('token') token: string) {
    return await this.authService.confirmEmail(res, token);
  }

  @Get('google')
  @UseGuards(GoogleGuard)
  googleAuth() {}

  @Get('google/redirect')
  @UseGuards(GoogleGuard)
  async googleOAuthredirect(@Req() req: UserRequest, @Res() res: Response) {
    await this.authService.googleAuthRedirect(req, res);
  }

  @Post('2fa/turn-on')
  @UseGuards(JwtGuard)
  async turnOn2fa(@Req() req: UserRequest) {
    return await this.authService.enableTwoFactorAuthentication(req.user);
  }

  @Patch('2fa/turn-off')
  @UseGuards(JwtGuard)
  async turnOff2fa(@Req() req: UserRequest) {
    return await this.authService.disableTwoFactorAuthentication(req.user);
  }

  @Post('2fa/authenticate')
  @UseGuards(JwtGuard)
  async authenticate2fa(@Req() req: UserRequest, @Body() body: Auth2FADto) {
    return await this.authService.authenticate2fa(req.user, body);
  }
}
