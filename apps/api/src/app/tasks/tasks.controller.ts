import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, OrgGuard, Roles } from '@turbovets/auth';
import { CreateTaskDto, Task } from '@turbovets/data';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard, OrgGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('Owner', 'Admin')
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user);
  }

  @Get()
  async findAll(@Request() req) {
    return this.tasksService.findAll(req.user.organization.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(+id, req.user.organization.id);
  }

  @Put(':id')
  @Roles('Owner', 'Admin')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: Partial<Task>,
    @Request() req
  ) {
    return this.tasksService.update(+id, updateTaskDto, req.user);
  }

  @Delete(':id')
  @Roles('Owner')
  async remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(+id, req.user);
  }
}
