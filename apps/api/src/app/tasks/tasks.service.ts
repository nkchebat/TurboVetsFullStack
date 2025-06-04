import { Injectable, Logger } from '@nestjs/common';
import { Task } from '@turbovets/data';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private tasks: Task[] = [
    {
      id: 1,
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the project',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Review pull requests',
      description: 'Review and merge pending pull requests',
      status: 'IN_PROGRESS',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Schedule Vet Appointment',
      description: 'Book annual checkup for pets',
      status: 'TODO',
      category: 'Personal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  async findAll(organizationId: number): Promise<Task[]> {
    this.logger.log(`Finding all tasks for organization ${organizationId}`);
    return this.tasks;
  }

  async findOne(id: number, organizationId: number): Promise<Task> {
    this.logger.log(`Finding task ${id} for organization ${organizationId}`);
    return this.tasks.find((task) => task.id === id);
  }

  async create(createTaskDto: Partial<Task>, user: any): Promise<Task> {
    this.logger.log('Creating new task:', createTaskDto);
    const newTask: Task = {
      id: Math.max(...this.tasks.map((t) => t.id), 0) + 1,
      ...createTaskDto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Task;
    this.tasks.push(newTask);
    return newTask;
  }

  async update(
    id: number,
    updateTaskDto: Partial<Task>,
    user: any
  ): Promise<Task> {
    this.logger.log(`Updating task ${id}:`, updateTaskDto);
    const index = this.tasks.findIndex((task) => task.id === id);
    if (index !== -1) {
      this.tasks[index] = {
        ...this.tasks[index],
        ...updateTaskDto,
        updatedAt: new Date().toISOString(),
      };
      return this.tasks[index];
    }
    return null;
  }

  async remove(id: number, user: any): Promise<void> {
    this.logger.log(`Removing task ${id}`);
    this.tasks = this.tasks.filter((task) => task.id !== id);
  }
}
