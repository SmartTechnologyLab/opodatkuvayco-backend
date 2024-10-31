import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto, UserDto } from './dto/user.dto';
import { v4 as uuidv4 } from 'uuid';

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
    user.password = password;

    const savedUser = await this.usersRepository.save(user);

    return this.toUserDto(savedUser);
  }

  findOne(data: number | any): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: data });
  }

  async validateUser({ username, password }: UserDto): Promise<User> {
    const user = await this.findOne({ username });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  toUserDto(user: Omit<User, 'password'>) {
    const { id, username } = user;

    return { id, username };
  }
}
