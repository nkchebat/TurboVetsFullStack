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
  organizationId?: number;
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
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => this.transformTaskForApi(task));
  }

  async findAllForOwner(
    ownerOrgId: number,
    targetOrgId?: number
  ): Promise<any[]> {
    this.logger.log(
      `Finding all tasks for Owner from org ${ownerOrgId}${
        targetOrgId ? ` targeting org ${targetOrgId}` : ' (all accessible orgs)'
      }`
    );

    // Get all organizations accessible to this owner (their org + all children)
    const accessibleOrgIds = await this.getAccessibleOrganizations(ownerOrgId);

    // If targetOrgId is specified and is accessible, filter to that org only
    let orgIdsToQuery = accessibleOrgIds;
    if (targetOrgId && targetOrgId > 0) {
      if (accessibleOrgIds.includes(targetOrgId)) {
        orgIdsToQuery = [targetOrgId];
      } else {
        // Target org is not accessible to this owner
        return [];
      }
    }
    // If targetOrgId is 0 or not provided, show all accessible organizations

    this.logger.log(
      `Querying tasks from organizations: ${orgIdsToQuery.join(', ')}`
    );

    const tasks = await this.tasksRepository.find({
      where: { organization: { id: In(orgIdsToQuery) } },
      relations: ['organization'],
      order: { createdAt: 'DESC' },
    });

    return tasks.map((task) => this.transformTaskForApi(task));
  }

  private async getAccessibleOrganizations(
    parentOrgId: number
  ): Promise<number[]> {
    console.log(
      '[TasksService] getAccessibleOrganizations called with parentOrgId:',
      parentOrgId
    );

    const accessibleIds = [parentOrgId]; // Always include the owner's own org
    console.log('[TasksService] Starting with accessible IDs:', accessibleIds);

    const childOrgs = await this.findAllChildOrganizations(parentOrgId);
    console.log(
      '[TasksService] Found child organizations:',
      childOrgs.map((org) => ({ id: org.id, name: org.name }))
    );

    accessibleIds.push(...childOrgs.map((org) => org.id));
    console.log('[TasksService] Final accessible IDs:', accessibleIds);

    return accessibleIds;
  }

  private async findAllChildOrganizations(
    parentOrgId: number
  ): Promise<Organization[]> {
    console.log(
      '[TasksService] findAllChildOrganizations called with parentOrgId:',
      parentOrgId
    );

    const allChildren: Organization[] = [];
    const queue = [parentOrgId];

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;
      console.log('[TasksService] Processing parentId:', currentParentId);

      const children = await this.organizationsRepository.find({
        where: { parentOrg: { id: currentParentId } },
      });

      console.log(
        '[TasksService] Found children for parent',
        currentParentId,
        ':',
        children.map((org) => ({ id: org.id, name: org.name }))
      );

      for (const child of children) {
        allChildren.push(child);
        queue.push(child.id); // Add to queue for recursive search
      }
    }

    console.log(
      '[TasksService] All children found:',
      allChildren.map((org) => ({ id: org.id, name: org.name }))
    );
    return allChildren;
  }

  async findOne(id: number, organizationId: number): Promise<any> {
    this.logger.log(`Finding task ${id} for organization ${organizationId}`);
    const task = await this.tasksRepository.findOne({
      where: {
        id,
        organization: { id: organizationId },
      },
      relations: ['organization'],
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
      'for context organization:',
      context.organization.id
    );

    // Determine target organization - use organizationId from DTO if provided and user has cross-org access
    let targetOrgId = context.organization.id;
    if (
      createTaskDto.organizationId &&
      context.user.role === 'Owner' &&
      context.organization.id === 1
    ) {
      // Ensure organizationId is a number for comparison
      const targetOrgIdNum =
        typeof createTaskDto.organizationId === 'string'
          ? parseInt(createTaskDto.organizationId, 10)
          : createTaskDto.organizationId;

      // Verify the target organization is accessible
      const accessibleOrgIds = await this.getAccessibleOrganizations(
        context.organization.id
      );
      if (accessibleOrgIds.includes(targetOrgIdNum)) {
        targetOrgId = targetOrgIdNum;
      } else {
        throw new Error(`Organization ${targetOrgIdNum} is not accessible`);
      }
    }

    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status
        ? this.apiStatusToDb(createTaskDto.status)
        : ('todo' as TaskStatus),
      category: createTaskDto.category as TaskCategory,
      organization: { id: targetOrgId },
      // owner: context.user, // Temporarily removed until we have proper user management
    });

    const savedTask = await this.tasksRepository.save(task);

    // Log the creation action
    await this.auditLogService.log(
      context.user.id,
      'CREATE',
      savedTask.id,
      `Created task: ${savedTask.title}`,
      targetOrgId
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
      'for context organization:',
      context.organization.id
    );

    // For cross-org users, we need to find the task in any accessible organization
    let task;
    if (context.user.role === 'Owner' && context.organization.id === 1) {
      // Owner at parent org can update tasks from any organization
      task = await this.tasksRepository.findOne({
        where: { id },
        relations: ['organization'],
      });
    } else {
      // Regular users can only update tasks in their current organization
      task = await this.tasksRepository.findOne({
        where: {
          id,
          organization: { id: context.organization.id },
        },
        relations: ['organization'],
      });
    }

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const oldValues = {
      title: task.title,
      description: task.description,
      status: this.dbStatusToApi(task.status),
      category: task.category,
      organizationId: task.organization.id,
    };

    // Update only allowed fields
    if (updateTaskDto.title) task.title = updateTaskDto.title;
    if (updateTaskDto.description) task.description = updateTaskDto.description;
    if (updateTaskDto.status)
      task.status = this.apiStatusToDb(updateTaskDto.status);
    if (updateTaskDto.category)
      task.category = updateTaskDto.category as TaskCategory;

    // Handle organization change for cross-org users
    if (
      updateTaskDto.organizationId &&
      context.user.role === 'Owner' &&
      context.organization.id === 1
    ) {
      // Ensure organizationId is a number for comparison
      const targetOrgIdNum =
        typeof updateTaskDto.organizationId === 'string'
          ? parseInt(updateTaskDto.organizationId, 10)
          : updateTaskDto.organizationId;

      // Verify the target organization is accessible
      const accessibleOrgIds = await this.getAccessibleOrganizations(
        context.organization.id
      );
      if (accessibleOrgIds.includes(targetOrgIdNum)) {
        task.organization = {
          id: targetOrgIdNum,
        } as Organization;
      } else {
        throw new Error(`Organization ${targetOrgIdNum} is not accessible`);
      }
    }

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
    if (updateTaskDto.organizationId) {
      // Ensure organizationId is a number for comparison
      const newOrgIdNum =
        typeof updateTaskDto.organizationId === 'string'
          ? parseInt(updateTaskDto.organizationId, 10)
          : updateTaskDto.organizationId;

      if (oldValues.organizationId !== newOrgIdNum) {
        const oldOrgName = await this.organizationsRepository.findOne({
          where: { id: oldValues.organizationId },
        });
        const newOrgName = await this.organizationsRepository.findOne({
          where: { id: newOrgIdNum },
        });
        changes.push(
          `organization: "${oldOrgName?.name || 'Unknown'}" → "${
            newOrgName?.name || 'Unknown'
          }"`
        );
      }
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

    // For cross-org users, we need to find the task in any accessible organization
    let task;
    if (context.user.role === 'Owner' && context.organization.id === 1) {
      // Owner at parent org can delete tasks from any organization
      task = await this.tasksRepository.findOne({
        where: { id },
        relations: ['organization'],
      });
    } else {
      // Regular users can only delete tasks in their current organization
      task = await this.tasksRepository.findOne({
        where: {
          id,
          organization: { id: context.organization.id },
        },
        relations: ['organization'],
      });
    }

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Log the deletion action before removing
    await this.auditLogService.log(
      context.user.id,
      'DELETE',
      task.id,
      `Deleted task: ${task.title}`,
      task.organization.id // Log to the task's actual organization
    );

    await this.tasksRepository.remove(task);
  }
}
