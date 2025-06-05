import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateUserDto } from '@turbovets/data';
import { TempUsersService } from './temp-users.service';

@Controller('users')
export class TempUsersController {
  constructor(private readonly usersService: TempUsersService) {}

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto & { organizationId: number }
  ) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}
