import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, OrgGuard, Roles } from '@turbovets/auth';
import { CreateUserDto, User } from '@turbovets/data';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, OrgGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('Owner')
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('Owner', 'Admin')
  async findUsersInOrganization(@Request() req) {
    const organizationId = req.user.organization.id;
    return this.usersService.findAllInOrganization(organizationId);
  }

  @Get('me')
  async getCurrentUser(@Request() req) {
    return req.user;
  }
}
