import { UserRole } from 'src/enum/user.enum';
import { User } from 'src/users/types';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface JwtToken {
  access_token: string;
  user: Omit<User, 'password'>;
}

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
}
