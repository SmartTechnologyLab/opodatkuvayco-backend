import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from './guards/jwt.quard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from '../user/entities/user.entity';
import { RefreshGuard } from './guards/refresh.guard';
import { RefreshDto } from './dto/refresh.dto';

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

  @ApiResponse({
    status: 200,
    type: User,
  })
  @Get('profile')
  @UseGuards(JwtGuard)
  getProfile(@Request() req: any): User {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...restCreds } = req.user;

    return restCreds;
  }

  @Post('logout')
  logout() {
    // Respond with instructions for the client to delete the JWT
    return { message: 'Please delete your JWT' };
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  async refresh(@Body() refreshDto: RefreshDto) {
    const tokens = await this.authService.refreshToken(refreshDto.refreshToken);
    return tokens;
  }
}
