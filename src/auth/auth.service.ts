import { Injectable } from '@nestjs/common';
import { Supabase } from './utils/Supabase';
import { IUser } from './types/IUser';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: Supabase) {}

  async validateUser(userInfo: IUser) {
    const users = await this.supabaseService.fetchData('Users');

    const existedUser = users.find((user) => user.email === userInfo.email);

    if (existedUser) {
      return existedUser;
    }

    const newUser = await this.supabaseService.insertData('Users', userInfo);

    return newUser;
  }

  async findUserById(id: string) {
    const users = await this.supabaseService.fetchData('Users');

    const findedUser = users.find((user) => user.id === id);

    return findedUser;
  }
}
