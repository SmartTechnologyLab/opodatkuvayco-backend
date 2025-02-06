import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateUserByProviderDto,
  CreateUserDto,
  UserDto,
} from './dto/user.dto';
import { v4 as uuidv4 } from 'uuid';
import { Providers } from './constants/providers';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register({
    username,
    password,
  }: CreateUserDto): Promise<{ username: string; id: string }> {
    const user = new User();
    user.id = uuidv4();
    user.username = username;

    if (password) {
      user.password = password;
    }

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  async registerByProvider({ email, provider }: CreateUserByProviderDto) {
    const user = new User();

    user.id = uuidv4();
    user.email = email;
    user.provider = provider;

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  async findOrCreateUser(user: User, provider: Providers) {
    const existingUser = await this.findOne({
      email: user.email,
      provider,
    });

    console.log('existingUser', existingUser);

    return existingUser ? existingUser : await this.registerByProvider(user);
  }

  findOne(data: Partial<User>): Promise<Partial<User> | undefined> {
    return this.usersRepository.findOne({ where: data });
  }

  async validateUser({ username, password }: UserDto): Promise<Partial<User>> {
    const user = await this.findOne({ username });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  toUserDto(user: Omit<Partial<User>, 'password'>) {
    const { id, username } = user;

    return { id, username };
  }
}
