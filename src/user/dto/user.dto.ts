import { IsNotEmpty } from 'class-validator';
import { Providers } from '../constants/providers';

export class UserDto {
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @IsNotEmpty({ message: 'Password field cannot be empty' })
  password: string;
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @IsNotEmpty({ message: 'Password field cannot be empty' })
  password?: string;
}

export class CreateUserByProviderDto {
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @IsNotEmpty({ message: 'Email field cannot be empty' })
  email: string;

  @IsNotEmpty({ message: 'Provider field cannot be empty' })
  provider: Providers;
}
