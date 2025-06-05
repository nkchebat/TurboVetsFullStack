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
    @Query('organizationId') organizationId: string = '1',
    @Query('userRole') userRole: string = 'Admin'
  ) {
    const targetOrgId = +organizationId;

    // For cross-organization operations, context should be user's home org, not target org
    const contextOrgId = userRole === 'Owner' ? 1 : targetOrgId;

    this.logger.log(
      'Creating task:',
      createTaskDto,
      'for context organization:',
      contextOrgId,
      'target organization:',
      targetOrgId,
      'with user role:',
      userRole
    );

    // Set up user context based on role
    const mockUser = {
      id: userRole === 'Owner' ? 0 : 1,
      role: userRole,
      organization: { id: contextOrgId },
    };

    return this.tasksService.create(createTaskDto, {
      organization: { id: contextOrgId },
      user: mockUser,
    });
  }

  @Get()
  async findAll(
    @Query('organizationId') organizationId: string = '1',
    @Query('userRole') userRole: string = 'Admin',
    @Query('targetOrgId') targetOrgId?: string
  ) {
    const orgId = +organizationId;
    const targetOrg = targetOrgId ? +targetOrgId : undefined;

    this.logger.log(
      'Finding all tasks for organization:',
      orgId,
      'with user role:',
      userRole
    );

    // If user is Owner at parent organization (id 1), use cross-organization access
    if (userRole === 'Owner' && orgId === 1) {
      this.logger.log('Owner at parent org - using cross-organization access');
      // If no target organization specified, show all accessible organizations (no filter)
      return this.tasksService.findAllForOwner(orgId, targetOrg || 0);
    } else {
      // Regular single-organization access
      this.logger.log('Regular single-organization access');
      return this.tasksService.findAll(orgId);
    }
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
    @Query('organizationId') organizationId: string = '1',
    @Query('userRole') userRole: string = 'Admin'
  ) {
    const targetOrgId = +organizationId;

    // For cross-organization operations, context should be user's home org, not target org
    const contextOrgId = userRole === 'Owner' ? 1 : targetOrgId;

    this.logger.log(
      `Updating task ${id}:`,
      updateTaskDto,
      'for context organization:',
      contextOrgId,
      'target organization:',
      targetOrgId,
      'with user role:',
      userRole
    );

    // Set up user context based on role
    const mockUser = {
      id: userRole === 'Owner' ? 0 : 1,
      role: userRole,
      organization: { id: contextOrgId },
    };

    return this.tasksService.update(+id, updateTaskDto, {
      organization: { id: contextOrgId },
      user: mockUser,
    });
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string = '1',
    @Query('userRole') userRole: string = 'Admin'
  ) {
    const targetOrgId = +organizationId;

    // For cross-organization operations, context should be user's home org, not target org
    const contextOrgId = userRole === 'Owner' ? 1 : targetOrgId;

    this.logger.log(
      `Removing task ${id} for context organization:`,
      contextOrgId,
      'target organization:',
      targetOrgId,
      'with user role:',
      userRole
    );

    // Set up user context based on role
    const mockUser = {
      id: userRole === 'Owner' ? 0 : 1,
      role: userRole,
      organization: { id: contextOrgId },
    };

    return this.tasksService.remove(+id, {
      organization: { id: contextOrgId },
      user: mockUser,
    });
  }
}
