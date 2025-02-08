import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserByProviderDto, CreateUserDto } from './dto/user.dto';
import { Providers } from './constants/providers';
import { UserBuilder } from './builder/user';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ChangeUsernameDto } from './dto/changeUsername.dto';

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

    const userBuilder = new UserBuilder();

    const user = userBuilder
      .setEmail(email)
      .setPassword(password)
      .setUsername(username)
      .setProviders([Providers.Own])
      .setId()
      .build();

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  async registerByProvider({
    email,
    provider,
    username,
  }: CreateUserByProviderDto) {
    const userBuilder = new UserBuilder();

    const user = userBuilder
      .setEmail(email)
      .setUsername(username)
      .setId()
      .setProviders([provider])
      .build();

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  async changePassword({ newPassword, oldPassword, id }: ChangePasswordDto) {
    try {
      const user = await this.findOne({ id });

      if (!(await bcrypt.compare(oldPassword, user.password))) {
        throw new UnauthorizedException('Invalid password');
      }

      const password = bcrypt.hashSync(newPassword, 10);

      const updatedUser = await this.updateUser(id, { password });

      return updatedUser;
    } catch (error) {
      throw new UnauthorizedException('Failed to change password');
    }
  }

  async changeUsername({ id, newUsername }: ChangeUsernameDto) {
    try {
      const updatedUser = await this.updateUser(id, { username: newUsername });

      return updatedUser;
    } catch (error) {
      throw new UnauthorizedException('Failed to change username');
    }
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

  async updateUser(userId: string, data: Partial<User>) {
    await this.usersRepository.update(userId, data);

    return this.findOne({ id: userId });
  }

  toUserDto(user: Pick<Partial<User>, 'username' | 'email' | 'id'>) {
    const { id, username, email } = user;

    return { id, username, email };
  }

  mapProvidersToNumbers(providers: Providers[] | undefined) {
    return providers?.map(Number) || [];
  }
}
