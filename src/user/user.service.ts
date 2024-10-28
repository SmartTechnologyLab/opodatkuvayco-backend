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

  register({ username, password }: CreateUserDto): Promise<User> {
    const user = new User();
    user.id = uuidv4();
    user.username = username;
    user.password = password;

    return this.usersRepository.save(user);
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
}
