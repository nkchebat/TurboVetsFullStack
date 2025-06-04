import { Test, TestingModule } from '@nestjs/testing';
import { TasksController, CreateTaskDto } from './tasks.controller';
import { TasksService, Task } from './tasks.service';
import { NotFoundException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO',
    category: 'Work',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Creation', () => {
    it('should create a new task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        category: 'Work',
      };

      mockTasksService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto);

      expect(result).toEqual(mockTask);
      expect(service.create).toHaveBeenCalledWith(createTaskDto, {
        organization: { id: 1 },
      });
    });

    it('should handle task creation with all fields', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Complete Task',
        description: 'Full Description',
        status: 'IN_PROGRESS',
        category: 'Personal',
      };

      mockTasksService.create.mockResolvedValue({
        ...mockTask,
        ...createTaskDto,
      });

      const result = await controller.create(createTaskDto);

      expect(result.title).toBe(createTaskDto.title);
      expect(result.status).toBe(createTaskDto.status);
      expect(result.category).toBe(createTaskDto.category);
    });

    it('should handle task creation errors', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Error Task',
        description: 'Error Description',
        category: 'Work',
      };

      mockTasksService.create.mockRejectedValue(new Error('Creation failed'));

      await expect(controller.create(createTaskDto)).rejects.toThrow(
        'Creation failed'
      );
    });
  });

  describe('Task Retrieval', () => {
    it('should return all tasks for organization', async () => {
      const mockTasks = [mockTask, { ...mockTask, id: 2, title: 'Task 2' }];
      mockTasksService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll();

      expect(result).toEqual(mockTasks);
      expect(service.findAll).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no tasks exist', async () => {
      mockTasksService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });

    it('should return a specific task by ID', async () => {
      mockTasksService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockTask);
      expect(service.findOne).toHaveBeenCalledWith(1, 1);
    });

    it('should handle non-existent task retrieval', async () => {
      mockTasksService.findOne.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should handle invalid task ID format', async () => {
      mockTasksService.findOne.mockRejectedValue(
        new Error('Invalid ID format')
      );

      await expect(controller.findOne('invalid')).rejects.toThrow();
    });
  });

  describe('Task Updates', () => {
    it('should update task successfully', async () => {
      const updateData = { title: 'Updated Title', status: 'DONE' as const };
      const updatedTask = { ...mockTask, ...updateData };

      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('1', updateData);

      expect(result).toEqual(updatedTask);
      expect(service.update).toHaveBeenCalledWith(1, updateData, {
        organization: { id: 1 },
      });
    });

    it('should handle partial task updates', async () => {
      const updateData = { description: 'Updated Description' };
      const updatedTask = { ...mockTask, ...updateData };

      mockTasksService.update.mockResolvedValue(updatedTask);

      const result = await controller.update('1', updateData);

      expect(result.description).toBe(updateData.description);
      expect(result.title).toBe(mockTask.title); // Should remain unchanged
    });

    it('should handle update of non-existent task', async () => {
      const updateData = { title: 'Updated Title' };
      mockTasksService.update.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(controller.update('999', updateData)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should validate update data types', async () => {
      const updateData = { status: 'INVALID_STATUS' as any };
      mockTasksService.update.mockRejectedValue(
        new Error('Invalid status value')
      );

      await expect(controller.update('1', updateData)).rejects.toThrow();
    });
  });

  describe('Task Deletion', () => {
    it('should delete task successfully', async () => {
      mockTasksService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1, {
        organization: { id: 1 },
      });
    });

    it('should handle deletion of non-existent task', async () => {
      mockTasksService.remove.mockRejectedValue(
        new NotFoundException('Task not found')
      );

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid task ID for deletion', async () => {
      mockTasksService.remove.mockRejectedValue(new Error('Invalid ID format'));

      await expect(controller.remove('invalid')).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle service layer errors gracefully', async () => {
      mockTasksService.findAll.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.findAll()).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should maintain organization context in all operations', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Org Task',
        description: 'Organization specific task',
        category: 'Work',
      };

      mockTasksService.create.mockResolvedValue(mockTask);
      mockTasksService.findAll.mockResolvedValue([mockTask]);
      mockTasksService.findOne.mockResolvedValue(mockTask);
      mockTasksService.update.mockResolvedValue(mockTask);
      mockTasksService.remove.mockResolvedValue(undefined);

      // Test all operations maintain organization context
      await controller.create(createTaskDto);
      await controller.findAll();
      await controller.findOne('1');
      await controller.update('1', { title: 'Updated' });
      await controller.remove('1');

      // Verify organization ID is passed to all service calls
      expect(service.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ organization: { id: 1 } })
      );
      expect(service.findAll).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledWith(expect.any(Number), 1);
      expect(service.update).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Object),
        expect.objectContaining({ organization: { id: 1 } })
      );
      expect(service.remove).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({ organization: { id: 1 } })
      );
    });
  });
});
