import { Module } from '@nestjs/common';
import { VqrService } from './vqr.service';
import { VqrController } from './vqr.controller';
// import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, TransactionsModule, JwtModule, ConfigModule],
  controllers: [VqrController],
  providers: [VqrService],
})
export class VqrModule { }
