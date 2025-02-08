import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password field cannot be empty' })
  password: string;
}

export class RegisterDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Name field cannot be empty' })
  username: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Email field cannot be empty' })
  email: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Password field cannot be empty' })
  password: string;
}
