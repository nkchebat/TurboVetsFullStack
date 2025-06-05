import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, CreateUserDto, Organization } from '@turbovets/data';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findAllInOrganization(organizationId: number) {
    return this.usersRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['organization'],
    });
  }

  async findAllInOwnerHierarchy(ownerOrgId: number, targetOrgId?: number) {
    // Get all organizations accessible to this owner (their org + all children)
    const accessibleOrgIds = await this.getAccessibleOrganizations(ownerOrgId);

    // If targetOrgId is specified and is accessible, filter to that org only
    let orgIdsToQuery = accessibleOrgIds;
    if (targetOrgId && accessibleOrgIds.includes(targetOrgId)) {
      orgIdsToQuery = [targetOrgId];
    } else if (targetOrgId && !accessibleOrgIds.includes(targetOrgId)) {
      // Target org is not accessible to this owner
      return [];
    }

    return this.usersRepository.find({
      where: { organization: { id: In(orgIdsToQuery) } },
      relations: ['organization'],
    });
  }

  private async getAccessibleOrganizations(
    parentOrgId: number
  ): Promise<number[]> {
    const accessibleIds = [parentOrgId]; // Always include the owner's own org
    const childOrgs = await this.findAllChildOrganizations(parentOrgId);
    accessibleIds.push(...childOrgs.map((org) => org.id));
    return accessibleIds;
  }

  private async findAllChildOrganizations(
    parentOrgId: number
  ): Promise<Organization[]> {
    const allChildren: Organization[] = [];
    const queue = [parentOrgId];

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;

      const children = await this.organizationsRepository.find({
        where: { parentOrg: { id: currentParentId } },
      });

      for (const child of children) {
        allChildren.push(child);
        queue.push(child.id); // Add to queue for recursive search
      }
    }

    return allChildren;
  }

  async update(id: number, updateData: Partial<User>) {
    const user = await this.findById(id);
    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }
}
