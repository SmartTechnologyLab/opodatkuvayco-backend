import { Controller, Get, Redirect, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './utils/Guards';
import { Request } from 'express';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('registration')
@Controller('auth')
export class AuthController {
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Successfully initiated Google authentication',
    schema: {
      properties: {
        message: { type: 'string', example: 'Google Auth' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Failed to initiate Google authentication',
  })
  @Redirect()
  getUserAuth() {
    return { msg: 'Google Auth' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'User succesfully got redirected',
  })
  getUserRedirect() {
    return { msg: 'Success' };
  }

  @Get('userInfo')
  @ApiResponse({
    status: 200,
    description: 'User status retrieved successfully',
    schema: {
      properties: {
        msg: { type: 'string', example: 'Authenticated' },
        user: {
          type: 'object',
          example: { id: '1', displayName: 'testUser', email: 'test@test.com' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'User status retrieved unsuccessfully',
    schema: {
      properties: {
        msg: {
          type: 'string',
          example: 'Not Authenticated',
        },
      },
    },
  })
  userStatus(@Req() request: Request) {
    if (request.user) {
      return { msg: 'Authenticated', user: request.user };
    }

    return { msg: 'Not Authenticated' };
  }
}
