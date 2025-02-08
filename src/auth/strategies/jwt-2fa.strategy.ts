import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { jwtConstants } from '../constants';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtConstants.accessSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne({ email: payload.email });

    if (!user.twoFactorAuthentificationEnabled) {
      return user;
    }

    if (payload.isTwoFactorAuthenticated) {
      return user;
    }
  }
}
