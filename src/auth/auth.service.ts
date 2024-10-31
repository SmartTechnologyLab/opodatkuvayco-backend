import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      user: this.userService.toUserDto(user),
      tokens: this.generateTokens(user),
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
      return newUser;
    }
  }

  decodeToken(token): any {
    return this.jwtService.decode(token);
  }

  generateTokens(user: Omit<User, 'password'>) {
    const accessToken = this.jwtService.sign({
      id: user.id,
      username: user.username,
    });

    const refreshToken = this.jwtService.sign(
      { id: user.id, username: user.username },
      {
        secret: 'refreshSecretKey',
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: 'refreshSecretKey',
      });

      const user = await this.userService.findOne({ id: payload.id });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
