import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
} from '@nestjs/common';
import { CreateTaskDto, Task } from '@turbovets/data';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  private readonly logger = new Logger(TasksController.name);
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto) {
    this.logger.log('Creating task:', createTaskDto);
    return this.tasksService.create(createTaskDto, { organization: { id: 1 } });
  }

  @Get()
  async findAll() {
    this.logger.log('Finding all tasks');
    return this.tasksService.findAll(1); // Default organization ID
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Finding task with id: ${id}`);
    return this.tasksService.findOne(+id, 1);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: Partial<Task>) {
    this.logger.log(`Updating task ${id}:`, updateTaskDto);
    return this.tasksService.update(+id, updateTaskDto, {
      organization: { id: 1 },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    this.logger.log(`Removing task with id: ${id}`);
    return this.tasksService.remove(+id, { organization: { id: 1 } });
  }
}
