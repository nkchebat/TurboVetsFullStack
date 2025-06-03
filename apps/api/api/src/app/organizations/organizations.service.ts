import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User, CreateOrganizationDto } from '@turbovets/data';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>
  ) {}

  async create(
    createOrgDto: CreateOrganizationDto,
    user: User
  ): Promise<Organization> {
    if (createOrgDto.parentOrgId && user.role !== 'Owner') {
      throw new BadRequestException('Only owners can create sub-organizations');
    }

    const organization = this.organizationRepository.create({
      ...createOrgDto,
      parentOrg: null,
      childOrganizations: [],
      users: [],
      tasks: [],
    });
    const savedOrg = await this.organizationRepository.save(organization);
    return savedOrg;
  }

  async findOne(id: number): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parentOrg', 'childOrganizations', 'users'],
    });
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return organization;
  }

  async findSubOrganizations(parentOrgId: number): Promise<Organization[]> {
    return this.organizationRepository.find({
      where: { parentOrg: { id: parentOrgId } },
      relations: ['users'],
    });
  }

  async update(
    id: number,
    updateOrgDto: Partial<Organization>,
    user: User
  ): Promise<Organization> {
    if (user.role !== 'Owner') {
      throw new NotFoundException('Organization not found');
    }
    const organization = await this.findOne(id);
    Object.assign(organization, updateOrgDto);
    const updatedOrg = await this.organizationRepository.save(organization);
    return updatedOrg;
  }

  async remove(id: number, user: User): Promise<void> {
    const organization = await this.findOne(id);
    if (organization.childOrganizations.length > 0) {
      throw new BadRequestException(
        'Cannot delete organization with sub-organizations'
      );
    }
    await this.organizationRepository.remove(organization);
  }
}
