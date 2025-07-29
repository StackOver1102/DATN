import { UserRole } from 'src/enum/user.enum';

export interface RoleProtected {
  roles: UserRole[];
}
