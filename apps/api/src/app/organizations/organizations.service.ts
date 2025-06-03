import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, CreateOrganizationDto, User } from '@turbovets/data';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>
  ) {}

  async create(createOrgDto: CreateOrganizationDto, user: User) {
    // If parentOrgId is provided, verify it exists and user has access
    let parentOrg: Organization | null = null;
    if (createOrgDto.parentOrgId) {
      parentOrg = await this.organizationsRepository.findOne({
        where: { id: createOrgDto.parentOrgId },
      });
      if (!parentOrg) {
        throw new NotFoundException('Parent organization not found');
      }

      // Only owner of parent org can create sub-orgs
      if (user.organization.id !== parentOrg.id || user.role !== 'Owner') {
        throw new BadRequestException('Cannot create sub-organization');
      }
    }

    const organization = this.organizationsRepository.create({
      ...createOrgDto,
      parentOrg,
    });

    return this.organizationsRepository.save(organization);
  }

  async findOne(id: number) {
    const org = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['parentOrg', 'childOrganizations', 'users'],
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async findSubOrganizations(parentOrgId: number) {
    return this.organizationsRepository.find({
      where: { parentOrg: { id: parentOrgId } },
      relations: ['users'],
    });
  }

  async update(id: number, updateData: Partial<Organization>, user: User) {
    const org = await this.findOne(id);

    // Only owner can update organization
    if (user.organization.id !== org.id || user.role !== 'Owner') {
      throw new NotFoundException('Organization not found');
    }

    Object.assign(org, updateData);
    return this.organizationsRepository.save(org);
  }

  async remove(id: number, user: User) {
    const org = await this.findOne(id);

    // Cannot delete organization with sub-organizations
    if (org.childOrganizations?.length > 0) {
      throw new BadRequestException(
        'Cannot delete organization with sub-organizations'
      );
    }

    // Only owner can delete organization
    if (user.organization.id !== org.id || user.role !== 'Owner') {
      throw new NotFoundException('Organization not found');
    }

    await this.organizationsRepository.remove(org);
  }
}
