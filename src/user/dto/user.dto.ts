import { IsNotEmpty } from 'class-validator';

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
