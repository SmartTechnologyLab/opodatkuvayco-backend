import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    console.log('GOOGLE CLIENT ID', configService.get('GOOGLE_AUTH_CLIENT_ID'));
    super({
      clientID: configService.get('GOOGLE_AUTH_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_AUTH_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_AUTH_REDIRECT_URL'),
      scope: ['email', 'profile'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user: Pick<User, 'username' | 'email'> = {
      username: profile.displayName,
      email: profile.emails[0].value,
    };

    done(null, user);
  }
}
