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
    email,
    password,
    username,
  }: CreateUserDto): Promise<{ username: string; id: string }> {
    const existingUser = await this.findOne({ email });

    if (existingUser) {
      throw new UnauthorizedException(`User with ${email} is already exists`);
    }

    const user = new User();
    user.id = uuidv4();
    user.username = username;
    user.password = password;

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  async registerByProvider({
    email,
    provider,
    username,
  }: CreateUserByProviderDto) {
    const user = new User();

    user.id = uuidv4();
    user.email = email;
    user.username = username;
    user.providers = [provider];

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  mapProvidersToNumbers(providers: Providers[]) {
    return providers.map(Number) || [];
  }

  async findOrCreateUserWithProvider(user: User, provider: Providers) {
    const existingUser = await this.findOne({
      email: user.email,
      username: user.username,
    });

    const userProviders = this.mapProvidersToNumbers(existingUser?.providers);

    if (existingUser && !userProviders.includes(provider)) {
      await this.usersRepository.update(existingUser.id, {
        providers: [...existingUser.providers, provider],
      });
    }

    return existingUser
      ? existingUser
      : await this.registerByProvider({ ...user, provider });
  }

  findOne(
    data: Omit<Partial<User>, 'providers' | 'password'>,
  ): Promise<Partial<User> | undefined> {
    return this.usersRepository.findOne({ where: data });
  }

  async validateUser({ email, password }: UserDto): Promise<Partial<User>> {
    const user = await this.findOne({ email });

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
