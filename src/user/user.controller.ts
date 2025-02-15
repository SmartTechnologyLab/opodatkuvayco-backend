import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.quard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ChangeUsernameDto } from './dto/changeUsername.dto';
import { Jwt2faAuthGuard } from 'src/auth/guards/jwt-2fa.guard';
import { UserRequest } from 'src/auth/types/userRequest';
import { User } from './entities/user.entity';
import { ApiResponse } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiResponse({
    status: 200,
    type: User,
  })
  @Get()
  @UseGuards(JwtGuard, Jwt2faAuthGuard)
  async getUsers(@Req() req: UserRequest) {
    return this.userService.toUserDto(req.user);
  }

  @Patch('change-password')
  @UseGuards(JwtGuard)
  async changePassword(@Body() body: ChangePasswordDto) {
    return await this.userService.changePassword(body);
  }

  @Patch('change-username')
  @UseGuards(JwtGuard)
  async changeUsername(@Body() body: ChangeUsernameDto) {
    return await this.userService.changeUsername(body);
  }
}
