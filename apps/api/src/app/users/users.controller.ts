import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  OrganizationHierarchyGuard,
  Roles,
  RequirePermissions,
} from '@turbovets/auth';
import { CreateUserDto, User } from '@turbovets/data';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, OrganizationHierarchyGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('Owner')
  @RequirePermissions('admin')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Query('organizationId') organizationId: string,
    @Request() req
  ) {
    const orgId = +organizationId;
    return this.usersService.create({
      ...createUserDto,
      organizationId: orgId,
    });
  }

  @Get()
  @Roles('Owner', 'Admin')
  @RequirePermissions('read')
  async findUsersInOrganization(
    @Request() req,
    @Query('organizationId') organizationId?: string
  ) {
    const targetOrgId = organizationId
      ? +organizationId
      : req.user.organization.id;

    // For Owners, they can access users from their hierarchy
    if (req.user.role === 'Owner') {
      return this.usersService.findAllInOwnerHierarchy(
        req.user.organization.id,
        targetOrgId
      );
    }

    // For Admins, only their own organization
    return this.usersService.findAllInOrganization(req.user.organization.id);
  }

  @Get('me')
  async getCurrentUser(@Request() req) {
    return req.user;
  }
}
