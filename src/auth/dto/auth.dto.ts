import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @IsNotEmpty({ message: 'Password field cannot be empty' })
  password: string;
}

export class RegisterDto {
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @IsNotEmpty({ message: 'Password field cannot be empty' })
  password: string;
}
