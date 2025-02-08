import { User } from 'src/user/entities/user.entity';

export interface UserRequest extends Request {
  user: User;
}
