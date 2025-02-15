import { Providers } from '../constants/providers';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class UserBuilder {
  private user: User;

  constructor(user?: Partial<User>) {
    this.user = Object.assign(new User(), user);
  }

  setId() {
    this.user.id = uuidv4();
    return this;
  }

  setUsername(username: string) {
    this.user.username = username;
    return this;
  }

  setPassword(password: string) {
    this.user.password = password;
    return this;
  }

  setEmail(email: string) {
    this.user.email = email;
    return this;
  }

  setProviders(providers: Providers[]) {
    this.user.providers = providers;
    return this;
  }

  setConfirmationToken() {
    const token = crypto.randomBytes(32).toString('hex');

    this.user.confirmationToken = token;
    return this;
  }

  build() {
    return this.user;
  }
}
