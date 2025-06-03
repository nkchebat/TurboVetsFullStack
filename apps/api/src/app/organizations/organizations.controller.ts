import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, OrgGuard, Roles } from '@turbovets/auth';
import { CreateOrganizationDto, Organization } from '@turbovets/data';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard, OrgGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles('Owner')
  async create(@Body() createOrgDto: CreateOrganizationDto, @Request() req) {
    return this.organizationsService.create(createOrgDto, req.user);
  }

  @Get('sub-organizations')
  @Roles('Owner', 'Admin')
  async findSubOrganizations(@Request() req) {
    return this.organizationsService.findSubOrganizations(
      req.user.organization.id
    );
  }

  @Get(':id')
  @Roles('Owner', 'Admin')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(+id);
  }

  @Put(':id')
  @Roles('Owner')
  async update(
    @Param('id') id: string,
    @Body() updateOrgDto: Partial<Organization>,
    @Request() req
  ) {
    return this.organizationsService.update(+id, updateOrgDto, req.user);
  }

  @Delete(':id')
  @Roles('Owner')
  async remove(@Param('id') id: string, @Request() req) {
    return this.organizationsService.remove(+id, req.user);
  }
}
