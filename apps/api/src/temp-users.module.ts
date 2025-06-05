import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@turbovets/data';
import { TempUsersService } from './temp-users.service';
import { TempUsersController } from './temp-users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [TempUsersService],
  controllers: [TempUsersController],
  exports: [TempUsersService],
})
export class TempUsersModule {}
