import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class Auth2FADto {
  @ApiProperty()
  @IsNotEmpty({ message: '2FA code cannot be empty' })
  @MinLength(6)
  code: string;
}
