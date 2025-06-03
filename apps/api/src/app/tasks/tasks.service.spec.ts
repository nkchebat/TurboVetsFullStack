import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, Organization } from '@turbovets/data';
import { TasksService } from './tasks.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let auditLogService: AuditLogService;

  const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'Owner',
    organization: { id: 1 } as Organization,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    owner: mockUser,
    organization: mockUser.organization,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn().mockReturnValue(mockTask),
            save: jest.fn().mockResolvedValue(mockTask),
            find: jest.fn().mockResolvedValue([mockTask]),
            findOne: jest.fn().mockResolvedValue(mockTask),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task and log the action', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
      };

      const result = await service.create(createTaskDto, mockUser);

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        owner: mockUser,
        organization: mockUser.organization,
      });
      expect(auditLogService.log).toHaveBeenCalledWith(
        mockUser.id,
        'CREATE',
        mockTask.id,
        'Task created'
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks for an organization', async () => {
      const result = await service.findAll(1);

      expect(result).toEqual([mockTask]);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { organization: { id: 1 } },
        relations: ['owner', 'organization'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a task if found', async () => {
      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, organization: { id: 1 } },
        relations: ['owner', 'organization'],
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task if user is owner', async () => {
      const updateData = { title: 'Updated Title' };

      const result = await service.update(1, updateData, mockUser);

      expect(result).toEqual(mockTask);
      expect(auditLogService.log).toHaveBeenCalledWith(
        mockUser.id,
        'UPDATE',
        mockTask.id,
        'Task updated'
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.update(999, { title: 'Updated' }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a task if user is owner', async () => {
      await service.remove(1, mockUser);

      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(auditLogService.log).toHaveBeenCalledWith(
        mockUser.id,
        'DELETE',
        mockTask.id,
        'Task deleted'
      );
    });

    it('should throw NotFoundException if task not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.remove(999, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
