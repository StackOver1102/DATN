import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/enum/user.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
