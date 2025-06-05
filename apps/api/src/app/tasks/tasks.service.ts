import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, TaskStatus, TaskCategory, Organization } from '@turbovets/data';
import { AuditLogService } from '../audit-log/audit-log.service';

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category: 'Work' | 'Personal' | 'Shopping' | 'Health' | 'Other';
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    private readonly auditLogService: AuditLogService
  ) {}

  // Transform database format to API format
  private transformTaskForApi(task: Task): any {
    return {
      ...task,
      status: this.dbStatusToApi(task.status),
      category: task.category, // Use the actual category from the database
    };
  }

  // Convert database status to API status
  private dbStatusToApi(status: TaskStatus): string {
    const statusMap = {
      todo: 'TODO',
      'in-progress': 'IN_PROGRESS',
      done: 'DONE',
    };
    return statusMap[status] || 'TODO';
  }

  // Convert API status to database status
  private apiStatusToDb(status: string): TaskStatus {
    const statusMap = {
      TODO: 'todo' as TaskStatus,
      IN_PROGRESS: 'in-progress' as TaskStatus,
      DONE: 'done' as TaskStatus,
    };
    return statusMap[status] || ('todo' as TaskStatus);
  }

  async findAll(organizationId: number): Promise<any[]> {
    this.logger.log(`Finding all tasks for organization ${organizationId}`);
    const tasks = await this.tasksRepository.find({
      where: { organization: { id: organizationId } },
      relations: ['owner', 'organization'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => this.transformTaskForApi(task));
  }

  async findAllForOwner(
    ownerOrgId: number,
    targetOrgId: number
  ): Promise<any[]> {
    this.logger.log(
      `Finding all tasks for Owner from org ${ownerOrgId} targeting org ${targetOrgId}`
    );

    // Get all organizations accessible to this owner (their org + all children)
    const accessibleOrgIds = await this.getAccessibleOrganizations(ownerOrgId);

    // If targetOrgId is specified and is accessible, filter to that org only
    let orgIdsToQuery = accessibleOrgIds;
    if (targetOrgId && accessibleOrgIds.includes(targetOrgId)) {
      orgIdsToQuery = [targetOrgId];
    } else if (targetOrgId && !accessibleOrgIds.includes(targetOrgId)) {
      // Target org is not accessible to this owner
      return [];
    }

    const tasks = await this.tasksRepository.find({
      where: { organization: { id: In(orgIdsToQuery) } },
      relations: ['owner', 'organization'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => this.transformTaskForApi(task));
  }

  private async getAccessibleOrganizations(
    parentOrgId: number
  ): Promise<number[]> {
    const accessibleIds = [parentOrgId]; // Always include the owner's own org
    const childOrgs = await this.findAllChildOrganizations(parentOrgId);
    accessibleIds.push(...childOrgs.map((org) => org.id));
    return accessibleIds;
  }

  private async findAllChildOrganizations(
    parentOrgId: number
  ): Promise<Organization[]> {
    const allChildren: Organization[] = [];
    const queue = [parentOrgId];

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;

      const children = await this.organizationsRepository.find({
        where: { parentOrg: { id: currentParentId } },
      });

      for (const child of children) {
        allChildren.push(child);
        queue.push(child.id); // Add to queue for recursive search
      }
    }

    return allChildren;
  }

  async findOne(id: number, organizationId: number): Promise<any> {
    this.logger.log(`Finding task ${id} for organization ${organizationId}`);
    const task = await this.tasksRepository.findOne({
      where: {
        id,
        organization: { id: organizationId },
      },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.transformTaskForApi(task);
  }

  async create(createTaskDto: CreateTaskDto, context: any): Promise<any> {
    this.logger.log(
      'Creating new task:',
      createTaskDto,
      'for organization:',
      context.organization.id
    );

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status
        ? this.apiStatusToDb(createTaskDto.status)
        : ('todo' as TaskStatus),
      category: createTaskDto.category as TaskCategory,
      organization: { id: context.organization.id },
      owner: context.user, // Now we have proper user context
    });

    const savedTask = await this.tasksRepository.save(task);

    // Log the creation action
    await this.auditLogService.log(
      context.user.id,
      'CREATE',
      savedTask.id,
      `Created task: ${savedTask.title}`,
      context.organization.id
    );

    return this.transformTaskForApi(savedTask);
  }

  async update(
    id: number,
    updateTaskDto: Partial<any>,
    context: any
  ): Promise<any> {
    this.logger.log(
      `Updating task ${id}:`,
      updateTaskDto,
      'for organization:',
      context.organization.id
    );

    const task = await this.tasksRepository.findOne({
      where: {
        id,
        organization: { id: context.organization.id },
      },
      relations: ['owner', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const oldValues = {
      title: task.title,
      description: task.description,
      status: this.dbStatusToApi(task.status),
      category: task.category,
    };

    // Update only allowed fields
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.status)
      task.status = this.apiStatusToDb(updateTaskDto.status);
    if (updateTaskDto.category)
      task.category = updateTaskDto.category as TaskCategory;

    const savedTask = await this.tasksRepository.save(task);

    // Log the update action with details about what changed
    const changes = [];
    if (updateTaskDto.title && oldValues.title !== updateTaskDto.title) {
      changes.push(`title: "${oldValues.title}" → "${updateTaskDto.title}"`);
    }
    if (
      updateTaskDto.description &&
      oldValues.description !== updateTaskDto.description
    ) {
      changes.push(
        `description: "${oldValues.description}" → "${updateTaskDto.description}"`
      );
    }
    if (updateTaskDto.status && oldValues.status !== updateTaskDto.status) {
      changes.push(`status: "${oldValues.status}" → "${updateTaskDto.status}"`);
    }
    if (
      updateTaskDto.category &&
      oldValues.category !== updateTaskDto.category
    ) {
      changes.push(
        `category: "${oldValues.category}" → "${updateTaskDto.category}"`
      );
    }

    await this.auditLogService.log(
      context.user.id,
      'UPDATE',
      savedTask.id,
      `Updated task: ${savedTask.title}. Changes: ${changes.join(', ')}`,
      context.organization.id
    );

    return this.transformTaskForApi(savedTask);
  }

  async remove(id: number, context: any): Promise<void> {
    this.logger.log(
      `Removing task ${id} for organization:`,
      context.organization.id
    );

    const task = await this.tasksRepository.findOne({
      where: {
        id,
        organization: { id: context.organization.id },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Log the deletion action before removing
    await this.auditLogService.log(
      context.user.id,
      'DELETE',
      task.id,
      `Deleted task: ${task.title}`,
      context.organization.id
    );

    await this.tasksRepository.remove(task);
  }
}
