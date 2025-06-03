import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '@turbovets/data';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  async log(
    userId: number,
    action: AuditAction,
    taskId: number,
    details: string
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      taskId,
      details,
      timestamp: new Date(),
    });
    return this.auditLogRepository.save(auditLog);
  }

  async findAll(userId?: number): Promise<AuditLog[]> {
    const queryBuilder =
      this.auditLogRepository.createQueryBuilder('audit_log');

    if (userId) {
      queryBuilder.where('audit_log.userId = :userId', { userId });
    }

    return queryBuilder
      .orderBy('audit_log.timestamp', 'DESC')
      .take(100)
      .getMany();
  }

  async findByTask(taskId: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { taskId },
      order: { timestamp: 'DESC' },
    });
  }
}
