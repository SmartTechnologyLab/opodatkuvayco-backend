import { Injectable } from '@nestjs/common';
import { Supabase } from './utils/Supabase';
import { IUser } from './types/IUser';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: Supabase) {}

  async validateUser(userInfo: IUser) {
    const users = await this.supabaseService.fetchData('Users');

    const usersMap = new Map(users.map((user) => [user.email, user]));

    if (usersMap.has(userInfo.email)) {
      return usersMap.get(userInfo.email);
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
