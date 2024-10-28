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
import { ApiTags } from '@nestjs/swagger';
// import { UserService } from '../user/user.service';
import { JwtGuard } from './guards/jwt.quard';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { User } from '../user/entities/user.entity';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    // private userService: UserService,
  ) {}

  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  getProfile(@Request() req: any): User {
    return req.user;
  }

  @Post('logout')
  logout() {
    // Respond with instructions for the client to delete the JWT
    return { message: 'Please delete your JWT' };
  }

  // @Get('status')
  // @UseGuards(JwtGuard)
  // status(@Req() req: Request) {
  //   console.log('Inside AuthController status method');
  //   console.log(req.user);
  //   return req.user;
  // }
  //
  //
  // @Post('refresh')
  // @UseGuards(RefreshGuard)
  // async refresh(@Body() refreshDto: RefreshDto) {
  //   const tokens = await this.authService.refreshToken(refreshDto.refreshToken);
  //   return tokens;
  // }
}
