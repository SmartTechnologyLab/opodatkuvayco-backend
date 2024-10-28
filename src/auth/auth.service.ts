import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    const payload = {
      user: {
        id: uuidv4(),
        username: loginDto.username,
      },
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser({ username, password: pass }: LoginDto) {
    const user = await this.userService.findOne({ username });

    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async register(registerDto: RegisterDto) {
    registerDto.password = bcrypt.hashSync(registerDto.password, 10);
    const newUser = await this.userService.register(registerDto);

    if (newUser) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = newUser;
      return result;
    }
  }

  decodeToken(token): any {
    return this.jwtService.decode(token);
  }
  //
  // async refreshToken(refreshToken: string) {
  //   try {
  //     const payload = this.jwtService.verify(refreshToken, {
  //       secret: 'refreshSecretKey',
  //     });
  //     const user = await this.userRepository.findOneBy({ id: payload.id });
  //     if (!user) {
  //       throw new Error('User not found');
  //     }
  //     return this.generateTokens(user);
  //   } catch (error) {
  //     throw new Error('Invalid refresh token');
  //   }
  // }
  //
  // generateTokens(user: User) {
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { password, ...userData } = user;
  //   const accessToken = this.jwtService.sign(userData);
  //   const refreshToken = this.jwtService.sign(userData, {
  //     secret: 'refreshSecretKey',
  //     expiresIn: '7d',
  //   });
  //   return { accessToken, refreshToken };
  // }
}
