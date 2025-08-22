import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateVqrDto } from './dto/create-vqr.dto';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class VqrService {
  constructor(private readonly authService: AuthService) {}
  create(createVqrDto: CreateVqrDto) {
    const { username, password } = createVqrDto;
    const user = this.authService.loginByVQR({email: username, password});
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
