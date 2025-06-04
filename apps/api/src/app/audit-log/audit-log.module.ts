import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Organization, User } from '@turbovets/data';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, Organization, User])],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
