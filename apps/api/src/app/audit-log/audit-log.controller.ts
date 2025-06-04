import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Roles } from '@turbovets/auth';
import { AuditLogService } from './audit-log.service';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('Owner', 'Admin')
  async findAll(@Request() req) {
    // If Owner, show all logs. If Admin, show only their org's logs
    const organizationId =
      req.user.role === 'Admin' ? req.user.organization.id : undefined;
    return this.auditLogService.findAll(organizationId);
  }

  @Get('task/:taskId')
  @Roles('Owner', 'Admin')
  async findByTask(@Param('taskId') taskId: string) {
    return this.auditLogService.findByTask(+taskId);
  }
}
