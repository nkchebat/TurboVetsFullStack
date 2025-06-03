import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, AuditAction, CreateTaskDto } from '@turbovets/data';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private auditLogService: AuditLogService
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      owner: user,
      organization: user.organization,
    });
    const savedTask = await this.taskRepository.save(task);
    await this.auditLogService.log(
      user.id,
      'CREATE' as AuditAction,
      savedTask.id,
      'Task created'
    );
    return savedTask;
  }

  async findAll(organizationId: number): Promise<Task[]> {
    return this.taskRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['owner', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, organizationId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, organization: { id: organizationId } },
      relations: ['owner', 'organization'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(
    id: number,
    updateTaskDto: Partial<Task>,
    user: User
  ): Promise<Task> {
    const task = await this.findOne(id, user.organization.id);
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);
    await this.auditLogService.log(
      user.id,
      'UPDATE' as AuditAction,
      id,
      'Task updated'
    );
    return updatedTask;
  }

  async remove(id: number, user: User): Promise<void> {
    const task = await this.findOne(id, user.organization.id);
    await this.taskRepository.remove(task);
    await this.auditLogService.log(
      user.id,
      'DELETE' as AuditAction,
      id,
      'Task deleted'
    );
  }
}
