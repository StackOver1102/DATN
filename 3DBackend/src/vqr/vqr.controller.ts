import { Controller, Post, Headers, UnauthorizedException } from '@nestjs/common';
import { VqrService } from './vqr.service';
// import { CreateVqrDto } from './dto/create-vqr.dto';
// import { UpdateVqrDto } from './dto/update-vqr.dto';

@Controller('vqr')
export class VqrController {
  constructor(private readonly vqrService: VqrService) { }

  @Post('/api/token_generate')
  create(@Headers() headers: Record<string, string>) {
    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Authorization header is missing or invalid');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    return this.vqrService.create({ username, password });
  }
}
