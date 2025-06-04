import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, User, Organization } from '@turbovets/data';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>
  ) {}

  // Backward compatible method signature
  async log(
    userId: number,
    action: AuditAction,
    taskId: number | null,
    details: string,
    organizationId?: number
  ): Promise<AuditLog>;

  // New method signature with role-based auditing
  async log(
    currentUserId: number,
    currentUserRole: string,
    currentOrganizationId: number,
    action: AuditAction,
    taskId: number | null,
    details: string
  ): Promise<AuditLog>;

  // Implementation
  async log(
    userIdOrCurrentUserId: number,
    actionOrCurrentUserRole: AuditAction | string,
    taskIdOrCurrentOrganizationId: number | null,
    detailsOrAction?: string | AuditAction,
    organizationIdOrTaskId?: number | null,
    detailsParam?: string
  ): Promise<AuditLog> {
    let auditUserId: number;
    let auditOrganizationId: number;
    let auditAction: AuditAction;
    let auditTaskId: number | null;
    let auditDetails: string;

    // Check if this is the new signature (6 parameters)
    if (arguments.length === 6 && typeof actionOrCurrentUserRole === 'string') {
      // New signature: currentUserId, currentUserRole, currentOrganizationId, action, taskId, details
      const currentUserId = userIdOrCurrentUserId;
      const currentUserRole = actionOrCurrentUserRole;
      const currentOrganizationId = taskIdOrCurrentOrganizationId as number;
      auditAction = detailsOrAction as AuditAction;
      auditTaskId = organizationIdOrTaskId as number | null;
      auditDetails = detailsParam as string;

      if (currentUserRole === 'Owner') {
        // Owner Rule: Log with user ID 0 and organization ID 0
        auditUserId = 0;
        auditOrganizationId = 0;
      } else if (currentUserRole === 'Admin') {
        // Admin Rule: Use admin user ID from currently selected organization
        const adminUser = await this.userRepository.findOne({
          where: {
            organization: { id: currentOrganizationId },
            role: 'Admin',
          },
          relations: ['organization'],
        });

        if (adminUser) {
          auditUserId = adminUser.id;
          auditOrganizationId = currentOrganizationId;
        } else {
          // Fallback if no admin found
          auditUserId = currentUserId;
          auditOrganizationId = currentOrganizationId;
        }
      } else {
        // For other roles, use current user context
        auditUserId = currentUserId;
        auditOrganizationId = currentOrganizationId;
      }
    } else {
      // Old signature: userId, action, taskId, details, organizationId?
      auditUserId = userIdOrCurrentUserId;
      auditAction = actionOrCurrentUserRole as AuditAction;
      auditTaskId = taskIdOrCurrentOrganizationId as number | null;
      auditDetails = detailsOrAction as string;
      auditOrganizationId = (organizationIdOrTaskId as number) || 1; // Default to org 1 if not provided
    }

    const auditLog = this.auditLogRepository.create({
      userId: auditUserId,
      action: auditAction,
      taskId: auditTaskId,
      details: auditDetails,
      organizationId: auditOrganizationId,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(organizationId?: number) {
    const query = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.organization', 'organization');

    if (organizationId) {
      query.where('audit_log.organizationId = :organizationId', {
        organizationId,
      });
    }

    return query
      .orderBy('audit_log.timestamp', 'DESC')
      .take(100) // Limit to last 100 entries
      .getMany();
  }

  async findByTask(taskId: number) {
    return this.auditLogRepository.find({
      where: { taskId },
      relations: ['organization'],
      order: { timestamp: 'DESC' },
    });
  }
}
