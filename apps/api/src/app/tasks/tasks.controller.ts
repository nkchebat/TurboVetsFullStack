import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { Task } from '@turbovets/data';
import { TasksService, CreateTaskDto } from './tasks.service';

@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Query('organizationId') organizationId: string = '1'
  ) {
    const orgId = +organizationId;
    this.logger.log(
      'Creating task:',
      createTaskDto,
      'for organization:',
      orgId
    );

    // Mock user context for now
    const mockUser = {
      id: 1,
      role: 'Admin',
      organization: { id: orgId },
    };

    return this.tasksService.create(createTaskDto, {
      organization: { id: orgId },
      user: mockUser,
    });
  }

  @Get()
  async findAll(@Query('organizationId') organizationId: string = '1') {
    const orgId = +organizationId;
    this.logger.log('Finding all tasks for organization:', orgId);
    return this.tasksService.findAll(orgId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string = '1'
  ) {
    const orgId = +organizationId;
    this.logger.log(`Finding task with id: ${id} for organization: ${orgId}`);
    return this.tasksService.findOne(+id, orgId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: Partial<Task>,
    @Query('organizationId') organizationId: string = '1'
  ) {
    const orgId = +organizationId;
    this.logger.log(
      `Updating task ${id}:`,
      updateTaskDto,
      'for organization:',
      orgId
    );

    // Mock user context for now
    const mockUser = {
      id: 1,
      role: 'Admin',
      organization: { id: orgId },
    };

    return this.tasksService.update(+id, updateTaskDto, {
      organization: { id: orgId },
      user: mockUser,
    });
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string = '1'
  ) {
    const orgId = +organizationId;
    this.logger.log(`Removing task with id: ${id} for organization: ${orgId}`);

    // Mock user context for now
    const mockUser = {
      id: 1,
      role: 'Admin',
      organization: { id: orgId },
    };

    return this.tasksService.remove(+id, {
      organization: { id: orgId },
      user: mockUser,
    });
  }
}
