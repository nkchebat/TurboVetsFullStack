import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  // UseGuards,
  // Request,
} from '@nestjs/common';
// import { JwtAuthGuard, RolesGuard, OrgGuard, Roles } from '@turbovets/auth';
import { CreateOrganizationDto, Organization } from '@turbovets/data';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
// @UseGuards(JwtAuthGuard, RolesGuard, OrgGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  // @Roles('Owner')
  async create(@Body() createOrgDto: CreateOrganizationDto) {
    // For now, create organizations without user context
    const mockUser = { organization: { id: 1 }, role: 'Owner' };
    return this.organizationsService.create(createOrgDto, mockUser as any);
  }

  @Get()
  // @Roles('Owner', 'Admin', 'Viewer')
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get('sub-organizations')
  // @Roles('Owner', 'Admin')
  async findSubOrganizations() {
    // For now, hardcode organization ID 1
    return this.organizationsService.findSubOrganizations(1);
  }

  @Get(':id')
  // @Roles('Owner', 'Admin')
  async findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(+id);
  }

  @Put(':id')
  // @Roles('Owner')
  async update(
    @Param('id') id: string,
    @Body() updateOrgDto: Partial<Organization>
  ) {
    const mockUser = { organization: { id: +id }, role: 'Owner' };
    return this.organizationsService.update(+id, updateOrgDto, mockUser as any);
  }

  @Delete(':id')
  // @Roles('Owner')
  async remove(@Param('id') id: string) {
    const mockUser = { organization: { id: +id }, role: 'Owner' };
    return this.organizationsService.remove(+id, mockUser as any);
  }
}
