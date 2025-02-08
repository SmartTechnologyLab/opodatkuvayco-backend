import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangeUsernameDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'User id field cannot be empty' })
  id: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'New username field cannot be empty' })
  @MinLength(4)
  newUsername: string;
}
