import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Patch,
} from '@nestjs/common';

import { AppService } from './app.service';

// Simple Task interface for testing
interface SimpleTask {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data for testing
const mockTasks: SimpleTask[] = [
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
  {
    id: 4,
    title: 'Buy groceries',
    description: 'Get weekly groceries from the store',
    status: 'DONE',
    category: 'Shopping',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'Exercise routine',
    description: '30 minutes of cardio',
    status: 'IN_PROGRESS',
    category: 'Health',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // Task endpoints for testing
  @Get('tasks')
  getAllTasks() {
    console.log('[API] GET /api/tasks - Returning', mockTasks.length, 'tasks');
    return mockTasks;
  }

  @Get('tasks/:id')
  getTask(@Param('id') id: string) {
    console.log('[API] GET /api/tasks/' + id);
    const task = mockTasks.find((t) => t.id === parseInt(id));
    if (!task) {
      console.log('[API] Task not found with id:', id);
      return { error: 'Task not found' };
    }
    console.log('[API] Found task:', task);
    return task;
  }

  @Post('tasks')
  createTask(@Body() taskData: Partial<SimpleTask>) {
    console.log('[API] POST /api/tasks - Creating task:', taskData);
    const newTask: SimpleTask = {
      id: Math.max(...mockTasks.map((t) => t.id), 0) + 1,
      title: taskData.title || 'New Task',
      description: taskData.description,
      status: taskData.status || 'TODO',
      category: taskData.category || 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.push(newTask);
    console.log('[API] Created new task:', newTask);
    return newTask;
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() taskData: Partial<SimpleTask>) {
    console.log('[API] PATCH /api/tasks/' + id + ' - Updating with:', taskData);
    const index = mockTasks.findIndex((t) => t.id === parseInt(id));
    if (index === -1) {
      console.log('[API] Task not found for update with id:', id);
      return { error: 'Task not found' };
    }
    mockTasks[index] = {
      ...mockTasks[index],
      ...taskData,
      updatedAt: new Date().toISOString(),
    };
    console.log('[API] Updated task:', mockTasks[index]);
    return mockTasks[index];
  }

  @Delete('tasks/:id')
  deleteTask(@Param('id') id: string) {
    console.log('[API] DELETE /api/tasks/' + id);
    const index = mockTasks.findIndex((t) => t.id === parseInt(id));
    if (index === -1) {
      console.log('[API] Task not found for deletion with id:', id);
      return { error: 'Task not found' };
    }
    const deletedTask = mockTasks.splice(index, 1)[0];
    console.log('[API] Deleted task:', deletedTask);
    return { message: 'Task deleted', task: deletedTask };
  }

  // Audit logs endpoint (empty for now)
  @Get('audit-logs')
  getAuditLogs() {
    console.log('[API] GET /api/audit-logs - Returning empty array');
    return [];
  }
}
