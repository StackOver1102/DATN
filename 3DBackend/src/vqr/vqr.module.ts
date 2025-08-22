import { Module } from '@nestjs/common';
import { VqrService } from './vqr.service';
import { VqrController } from './vqr.controller';
// import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VqrController],
  providers: [VqrService],
})
export class VqrModule {}
