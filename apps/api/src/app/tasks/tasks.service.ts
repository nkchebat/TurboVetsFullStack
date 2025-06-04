import { Injectable, Logger } from '@nestjs/common';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category: 'Work' | 'Personal' | 'Shopping' | 'Health' | 'Other';
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private tasks: Task[] = [
    // Work Tasks
    {
      id: 1,
      title: 'Complete project documentation',
      description:
        'Write comprehensive documentation for the new feature implementation',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: 2,
      title: 'Review pull requests',
      description:
        'Review and provide feedback on pending pull requests from team members',
      status: 'IN_PROGRESS',
      category: 'Work',
      createdAt: new Date('2024-01-10').toISOString(),
      updatedAt: new Date('2024-01-12').toISOString(),
    },
    {
      id: 3,
      title: 'Deploy to production',
      description:
        'Successfully deployed the latest release to production environment',
      status: 'DONE',
      category: 'Work',
      createdAt: new Date('2024-01-05').toISOString(),
      updatedAt: new Date('2024-01-08').toISOString(),
    },
    // Personal Tasks
    {
      id: 4,
      title: 'Schedule vet appointment',
      description:
        'Book annual checkup for pets at the local veterinary clinic',
      status: 'TODO',
      category: 'Personal',
      createdAt: new Date('2024-01-14').toISOString(),
      updatedAt: new Date('2024-01-14').toISOString(),
    },
    {
      id: 5,
      title: 'Plan weekend trip',
      description:
        'Research and book accommodations for the upcoming weekend getaway',
      status: 'IN_PROGRESS',
      category: 'Personal',
      createdAt: new Date('2024-01-12').toISOString(),
      updatedAt: new Date('2024-01-13').toISOString(),
    },
    {
      id: 6,
      title: 'Organize photo albums',
      description: 'Sorted and organized all family photos from the past year',
      status: 'DONE',
      category: 'Personal',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-07').toISOString(),
    },
    // Shopping Tasks
    {
      id: 7,
      title: 'Buy groceries for the week',
      description:
        'Purchase fresh vegetables, fruits, and pantry staples for meal planning',
      status: 'TODO',
      category: 'Shopping',
      createdAt: new Date('2024-01-16').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString(),
    },
    {
      id: 8,
      title: 'Compare laptop prices',
      description:
        'Research and compare prices for a new development laptop across different retailers',
      status: 'IN_PROGRESS',
      category: 'Shopping',
      createdAt: new Date('2024-01-11').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: 9,
      title: 'Purchase birthday gift',
      description:
        'Found and purchased the perfect birthday gift for my colleague',
      status: 'DONE',
      category: 'Shopping',
      createdAt: new Date('2024-01-03').toISOString(),
      updatedAt: new Date('2024-01-06').toISOString(),
    },
    // Health Tasks
    {
      id: 10,
      title: 'Schedule annual physical',
      description: 'Book yearly health checkup with primary care physician',
      status: 'TODO',
      category: 'Health',
      createdAt: new Date('2024-01-13').toISOString(),
      updatedAt: new Date('2024-01-13').toISOString(),
    },
    {
      id: 11,
      title: 'Start morning exercise routine',
      description:
        'Implementing a consistent 30-minute morning workout schedule',
      status: 'IN_PROGRESS',
      category: 'Health',
      createdAt: new Date('2024-01-08').toISOString(),
      updatedAt: new Date('2024-01-14').toISOString(),
    },
    {
      id: 12,
      title: 'Complete dental cleaning',
      description: 'Successfully completed routine dental cleaning and checkup',
      status: 'DONE',
      category: 'Health',
      createdAt: new Date('2024-01-02').toISOString(),
      updatedAt: new Date('2024-01-04').toISOString(),
    },
    // Other Tasks
    {
      id: 13,
      title: 'Learn new programming language',
      description:
        'Study and practice a new programming language for skill development',
      status: 'TODO',
      category: 'Other',
      createdAt: new Date('2024-01-17').toISOString(),
      updatedAt: new Date('2024-01-17').toISOString(),
    },
    {
      id: 14,
      title: 'Volunteer at community center',
      description:
        "Helping out at the local community center's weekly food distribution",
      status: 'IN_PROGRESS',
      category: 'Other',
      createdAt: new Date('2024-01-09').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString(),
    },
    {
      id: 15,
      title: "Renew driver's license",
      description: "Successfully renewed driver's license at the DMV office",
      status: 'DONE',
      category: 'Other',
      createdAt: new Date('2024-01-01').toISOString(),
      updatedAt: new Date('2024-01-05').toISOString(),
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
