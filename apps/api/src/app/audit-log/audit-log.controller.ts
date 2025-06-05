import { Controller, Get, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async findAll(@Query('organizationId') organizationId: string = '1') {
    const targetOrgId = +organizationId;
    return this.auditLogService.findAll(targetOrgId);
  }

  @Get('all')
  async findAllLogs() {
    // For Owner access - returns all audit logs across all organizations
    return this.auditLogService.findAll(); // Call without organizationId to get all
  }

  @Get('task/:taskId')
  async findByTask(
    @Param('taskId') taskId: string,
    @Query('organizationId') organizationId: string = '1'
  ) {
    const orgId = +organizationId;
    return this.auditLogService.findByTask(+taskId, orgId);
  }
}
