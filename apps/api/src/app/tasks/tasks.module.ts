import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@turbovets/data';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), AuditLogModule],
  providers: [TasksService],
  controllers: [TasksController],
})
export class TasksModule {}
