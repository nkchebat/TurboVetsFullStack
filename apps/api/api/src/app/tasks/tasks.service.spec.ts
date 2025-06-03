import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Task,
  User,
  Organization,
  UserRole,
  TaskStatus,
  AuditAction,
} from '@turbovets/data';
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
    role: 'Owner' as UserRole,
    organization: { id: 1 } as Organization,
    tasks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo' as TaskStatus,
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

  test('service should be properly initialized', () => {
    expect(service).toBeDefined();
  });

  describe('Task Creation', () => {
    test('CREATE TASK: Should create a new task with proper user and organization associations', async () => {
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
        'CREATE' as AuditAction,
        mockTask.id,
        'Task created'
      );
    });
  });

  describe('Task Retrieval', () => {
    test('GET ALL TASKS: Should retrieve all tasks for an organization with proper relations loaded', async () => {
      const result = await service.findAll(1);

      expect(result).toEqual([mockTask]);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { organization: { id: 1 } },
        relations: ['owner', 'organization'],
        order: { createdAt: 'DESC' },
      });
    });

    test('GET SINGLE TASK: Should retrieve a specific task with organization context', async () => {
      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, organization: { id: 1 } },
        relations: ['owner', 'organization'],
      });
    });

    test('GET SINGLE TASK ERROR: Should handle non-existent task retrieval appropriately', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Task Updates', () => {
    test('UPDATE TASK: Should update task details when user has proper permissions', async () => {
      const updateData = { title: 'Updated Title' };

      const result = await service.update(1, updateData, mockUser);

      expect(result).toEqual(mockTask);
      expect(auditLogService.log).toHaveBeenCalledWith(
        mockUser.id,
        'UPDATE' as AuditAction,
        mockTask.id,
        'Task updated'
      );
    });

    test('UPDATE TASK ERROR: Should handle update attempts on non-existent tasks', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.update(999, { title: 'Updated' }, mockUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Task Deletion', () => {
    test('DELETE TASK: Should remove task when user has proper ownership rights', async () => {
      await service.remove(1, mockUser);

      expect(taskRepository.remove).toHaveBeenCalledWith(mockTask);
      expect(auditLogService.log).toHaveBeenCalledWith(
        mockUser.id,
        'DELETE' as AuditAction,
        mockTask.id,
        'Task deleted'
      );
    });

    test('DELETE TASK ERROR: Should handle deletion attempts on non-existent tasks', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(service.remove(999, mockUser)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
