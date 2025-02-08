import { Injectable, Req, Res, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/entities/user.entity';
import { jwtConstants } from './constants';
import { Providers } from 'src/user/constants/providers';
import { UserRequest } from './types/userRequest';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { Auth2FADto } from './dto/auth2fa.dto';

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

  async validateUser({ email, password: pass }: LoginDto) {
    const user = await this.userService.findOne({ email });

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

  // TODO: pass email for jwt sign
  generateTokens(user: Partial<User>) {
    const accessToken = this.jwtService.sign({
      id: user.id,
      email: user.email,
    });

    const refreshToken = this.jwtService.sign(
      { id: user.id, username: user.email },
      {
        secret: jwtConstants.refreshSecret,
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  generateTokensFor2Fa(
    user: Partial<User>,
    isTwoFactorAuthenticationEnabled: boolean,
    isTwoFactorAuthenticated: boolean,
  ) {
    const accessToken = this.jwtService.sign({
      id: user.id,
      email: user.email,
      isTwoFactorAuthenticationEnabled,
      isTwoFactorAuthenticated,
    });

    const refreshToken = this.jwtService.sign(
      {
        id: user.id,
        username: user.email,
      },
      {
        secret: jwtConstants.refreshSecret,
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConstants.refreshSecret,
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

  async googleAuthRedirect(@Req() req: UserRequest, @Res() res: Response) {
    try {
      const userProfile = req.user;

      const user = await this.userService.findOrCreateUserWithProvider(
        userProfile,
        Providers.Google,
      );

      const tokens = this.generateTokens(user);

      res.redirect(
        `${process.env.CLIENT_URL}#accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      );
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}#error=${error.message}`);
    }
  }

  async generateTwoFactorAuthSecret(user: User) {
    const secret = authenticator.generateSecret();

    const otpAuthUrl = authenticator.keyuri(
      user.email,
      process.env.APP_NAME,
      secret,
    );

    await this.userService.updateUser(user.id, {
      twoFactorAuthentificationSecret: secret,
      twoFactorAuthentificationEnabled: true,
    });

    return otpAuthUrl;
  }

  async generateQRCodeDataUrl(otpAuthUrl: string) {
    return toDataURL(otpAuthUrl);
  }

  isTwoFactorAuthenticationCodeValid(
    twoFactorAuthenticationCode: string,
    user: User,
  ) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorAuthentificationSecret,
    });
  }

  async loginWith2fa(user: Partial<User>) {
    return {
      email: user.email,
      access_token: this.generateTokensFor2Fa(
        user,
        !!user.twoFactorAuthentificationEnabled,
        true,
      ),
    };
  }

  async authenticate2fa(user: User, body: Auth2FADto) {
    const isCodeValid = this.isTwoFactorAuthenticationCodeValid(
      body.code,
      user,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    return this.loginWith2fa(user);
  }

  async enableTwoFactorAuthentication(user: User) {
    try {
      const otpAuthUrl = await this.generateTwoFactorAuthSecret(user);

      const qrCodeDataUrl = await this.generateQRCodeDataUrl(otpAuthUrl);

      return qrCodeDataUrl;
    } catch {
      throw new UnauthorizedException(
        'Failed to enable two-factor authentication',
      );
    }
  }

  async disableTwoFactorAuthentication(user: User) {
    try {
      await this.userService.updateUser(user.id, {
        twoFactorAuthentificationSecret: null,
        twoFactorAuthentificationEnabled: false,
      });

      return 'Two-factor authentication disabled';
    } catch {
      throw new UnauthorizedException(
        'Failed to disable two-factor authentication',
      );
    }
  }
}
