import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User } from '@turbovets/data';
import { OrganizationsService } from './organizations.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let orgRepository: Repository<Organization>;

  const mockOrg: Organization = {
    id: 1,
    name: 'Test Org',
    parentOrg: null,
    childOrganizations: [],
    users: [],
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'Owner',
    organization: mockOrg,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            create: jest.fn().mockReturnValue(mockOrg),
            save: jest.fn().mockResolvedValue(mockOrg),
            findOne: jest.fn().mockResolvedValue(mockOrg),
            find: jest.fn().mockResolvedValue([mockOrg]),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    orgRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an organization without parent', async () => {
      const createOrgDto = { name: 'New Org' };

      const result = await service.create(createOrgDto, mockUser);

      expect(result).toEqual(mockOrg);
      expect(orgRepository.create).toHaveBeenCalledWith({
        ...createOrgDto,
        parentOrg: null,
      });
    });

    it('should throw BadRequestException when creating sub-org without proper permissions', async () => {
      const createOrgDto = { name: 'Sub Org', parentOrgId: 2 };
      const nonOwnerUser = { ...mockUser, role: 'Admin' };

      await expect(service.create(createOrgDto, nonOwnerUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findOne', () => {
    it('should return an organization if found', async () => {
      const result = await service.findOne(1);

      expect(result).toEqual(mockOrg);
      expect(orgRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['parentOrg', 'childOrganizations', 'users'],
      });
    });

    it('should throw NotFoundException if organization not found', async () => {
      jest.spyOn(orgRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findSubOrganizations', () => {
    it('should return sub-organizations', async () => {
      const result = await service.findSubOrganizations(1);

      expect(result).toEqual([mockOrg]);
      expect(orgRepository.find).toHaveBeenCalledWith({
        where: { parentOrg: { id: 1 } },
        relations: ['users'],
      });
    });
  });

  describe('update', () => {
    it('should update an organization if user is owner', async () => {
      const updateData = { name: 'Updated Org' };

      const result = await service.update(1, updateData, mockUser);

      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException if not owner', async () => {
      const nonOwnerUser = { ...mockUser, role: 'Admin' };

      await expect(
        service.update(1, { name: 'Updated' }, nonOwnerUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an organization if user is owner and no sub-orgs exist', async () => {
      await service.remove(1, mockUser);

      expect(orgRepository.remove).toHaveBeenCalledWith(mockOrg);
    });

    it('should throw BadRequestException if org has sub-organizations', async () => {
      const orgWithChildren = {
        ...mockOrg,
        childOrganizations: [{ id: 2, name: 'Sub Org' }],
      };
      jest
        .spyOn(orgRepository, 'findOne')
        .mockResolvedValueOnce(orgWithChildren);

      await expect(service.remove(1, mockUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
