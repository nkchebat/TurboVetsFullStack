import { Module } from '@nestjs/common';
import { AuthModule as SharedAuthModule } from '@turbovets/auth';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';

@Module({
  imports: [SharedAuthModule, UsersModule],
  controllers: [AuthController],
})
export class AuthModule {}
