import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, User, UserRole } from '@turbovets/data';
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
    role: 'Owner' as UserRole,
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

  test('service should be properly initialized', () => {
    expect(service).toBeDefined();
  });

  describe('Organization Creation', () => {
    test('CREATE ORG: Should create top-level organization with no parent specified', async () => {
      const createOrgDto = { name: 'New Org' };

      const result = await service.create(createOrgDto, mockUser);

      expect(result).toEqual(mockOrg);
      expect(orgRepository.create).toHaveBeenCalledWith({
        ...createOrgDto,
        parentOrg: null,
        childOrganizations: [],
        users: [],
        tasks: [],
      });
    });

    test('CREATE ORG ERROR: Should prevent non-owner users from creating sub-organizations', async () => {
      const createOrgDto = { name: 'Sub Org', parentOrgId: 2 };
      const nonOwnerUser = { ...mockUser, role: 'Admin' as UserRole };

      await expect(service.create(createOrgDto, nonOwnerUser)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('Organization Retrieval', () => {
    test('GET ORG: Should retrieve organization with complete relationship tree', async () => {
      const result = await service.findOne(1);

      expect(result).toEqual(mockOrg);
      expect(orgRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['parentOrg', 'childOrganizations', 'users'],
      });
    });

    test('GET ORG ERROR: Should handle retrieval of non-existent organization', async () => {
      jest.spyOn(orgRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Sub-Organization Management', () => {
    test('GET SUB-ORGS: Should retrieve all child organizations with user details', async () => {
      const result = await service.findSubOrganizations(1);

      expect(result).toEqual([mockOrg]);
      expect(orgRepository.find).toHaveBeenCalledWith({
        where: { parentOrg: { id: 1 } },
        relations: ['users'],
      });
    });
  });

  describe('Organization Updates', () => {
    test('UPDATE ORG: Should modify organization details with owner permissions', async () => {
      const updateData = { name: 'Updated Org' };

      const result = await service.update(1, updateData, mockUser);

      expect(result).toEqual(mockOrg);
    });

    test('UPDATE ORG ERROR: Should prevent non-owner users from updating organizations', async () => {
      const nonOwnerUser = { ...mockUser, role: 'Admin' as UserRole };

      await expect(
        service.update(1, { name: 'Updated' }, nonOwnerUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Organization Deletion', () => {
    test('DELETE ORG: Should remove organization with no sub-organizations', async () => {
      await service.remove(1, mockUser);

      expect(orgRepository.remove).toHaveBeenCalledWith(mockOrg);
    });

    test('DELETE ORG ERROR: Should prevent deletion of organizations with child organizations', async () => {
      const orgWithChildren = {
        ...mockOrg,
        childOrganizations: [{ ...mockOrg, id: 2, name: 'Sub Org' }],
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
