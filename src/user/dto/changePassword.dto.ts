import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'User id field cannot be empty' })
  id: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Old password field cannot be empty' })
  oldPassword: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'New password field cannot be empty' })
  newPassword: string;
}
