import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateVqrDto } from './dto/create-vqr.dto';
import { AuthService } from 'src/auth/auth.service';
@Injectable()
export class VqrService {
  constructor(private readonly authService: AuthService) {}
  async create(createVqrDto: CreateVqrDto) {
    const { username, password } = createVqrDto;
    const user = await this.authService.loginByVQR({email: username, password});
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
