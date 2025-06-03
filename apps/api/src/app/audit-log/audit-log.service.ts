import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '@turbovets/data';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  async log(
    userId: number,
    action: AuditAction,
    taskId: number | null,
    details: string
  ) {
    const auditLog = this.auditLogRepository.create({
      userId,
      action,
      taskId,
      details,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(userId?: number) {
    const query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (userId) {
      query.where('audit_log.userId = :userId', { userId });
    }

    return query
      .orderBy('audit_log.timestamp', 'DESC')
      .take(100) // Limit to last 100 entries
      .getMany();
  }

  async findByTask(taskId: number) {
    return this.auditLogRepository.find({
      where: { taskId },
      order: { timestamp: 'DESC' },
    });
  }
}
