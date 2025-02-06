import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_AUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/redirect',
      // callbackUrl: process.env.GOOGLE_AUTH_REDIRECT_URL,
      scope: ['email', 'profile'],
    });
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user = {
      username: profile.displayName,
      email: profile.emails[0].value,
    };

    done(null, user);
  }
}
// {
//   profile: {
//     id: '102512310851649597376',
//     displayName: 'Yevhenii',
//     name: { familyName: undefined, givenName: 'Yevhenii' },
//     emails: [ [Object] ],
//     photos: [ [Object] ],
//     provider: 'google',
//     _raw: '{\n' +
//       '  "sub": "102512310851649597376",\n' +
//       '  "name": "Yevhenii",\n' +
//       '  "given_name": "Yevhenii",\n' +
//       '  "picture": "https://lh3.googleusercontent.com/a/ACg8ocLlnUl3osDlRnqZIVG_lPcWyWkIdczgZsXxs6x2LFTN5PPnYtY\\u003ds96-c",\n' +
//       '  "email": "zheki2004@gmail.com",\n' +
//       '  "email_verified": true\n' +
//       '}',
//     _json: {
//       sub: '102512310851649597376',
//       name: 'Yevhenii',
//       given_name: 'Yevhenii',
//       picture: 'https://lh3.googleusercontent.com/a/ACg8ocLlnUl3osDlRnqZIVG_lPcWyWkIdczgZsXxs6x2LFTN5PPnYtY=s96-c',
//       email: 'zheki2004@gmail.com',
//       email_verified: true
//     }
//   },
//   accessToken: 'ya29.a0AXeO80QdV1e4WRfN7UfyzFFMv6RbTVCwxqhRrViCQnFRc7wni7Wee9KlAnaTUtvYrX84Cmsg2LPBAzBpqyOnmMl3-RlLKsDny499r7D4htuZCC-m7qtfhEwfDRIuVkB_mPeMKYE2lshPS0ouFqi0nQZWiXkZCNjtZI4ufEntlgaCgYKAaYSARASFQHGX2MiwItlgrbUJQIiYbmASTesHg0177',
//   refreshToken: undefined
// }
