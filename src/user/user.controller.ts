import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.quard';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ChangeUsernameDto } from './dto/changeUsername.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard)
  @Patch('change-password')
  async changePassword(@Body() body: ChangePasswordDto) {
    return await this.userService.changePassword(body);
  }

  @UseGuards(JwtGuard)
  @Patch('change-username')
  async changeUsername(@Body() body: ChangeUsernameDto) {
    return await this.userService.changeUsername(body);
  }
}
