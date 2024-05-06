import { Injectable } from '@nestjs/common';
import { IUser } from './types/IUser';
import { SupabaseService } from 'src/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async validateUser(userInfo: IUser) {
    const users = await this.supabaseService.fetchData('Users');

    const usersMap = new Map(users.map((user) => [user.email, user]));

    if (usersMap.has(userInfo.email)) {
      return usersMap.get(userInfo.email);
    }

    await this.supabaseService.insertData('Users', userInfo);

    const updatedUsers = await this.supabaseService.fetchData('Users');

    const updatedUsersMap = new Map(
      updatedUsers.map((user) => [user.email, user]),
    );

    return updatedUsersMap.get(userInfo.email);
  }

  async findUserById(id: string) {
    const users = await this.supabaseService.fetchData('Users');

    const findedUser = users.find((user) => user.id === id);

    return findedUser;
  }
}
