import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class CustomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Custom authentication logic goes here
    // For example, you could check if the request includes a specific header
    const request = context.switchToHttp().getRequest();
    return request.headers['x-custom-header'] === 'my-secret-value';
  }
}
