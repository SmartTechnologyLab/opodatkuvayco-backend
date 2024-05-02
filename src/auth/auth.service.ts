import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getAuthHello() {
    return 'Hello auth';
  }
}
