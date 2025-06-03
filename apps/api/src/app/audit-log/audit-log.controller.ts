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
    return this.auditLogService.findAll(
      req.user.role === 'Admin' ? req.user.id : undefined
    );
  }

  @Get('task/:taskId')
  @Roles('Owner', 'Admin')
  async findByTask(@Param('taskId') taskId: string) {
    return this.auditLogService.findByTask(+taskId);
  }
}
