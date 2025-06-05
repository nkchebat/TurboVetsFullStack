import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, Task, AuditLog } from '@turbovets/data';
import { TasksModule } from '../../../src/app/tasks/tasks.module';
import { OrganizationsModule } from '../../../src/app/organizations/organizations.module';
import { AuditLogModule } from '../../../src/app/audit-log/audit-log.module';
import { TempUsersModule } from '../../../src/temp-users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Organization, Task, AuditLog],
      synchronize: true, // Set to false in production
      logging: true,
    }),
    TasksModule,
    OrganizationsModule,
    AuditLogModule,
    TempUsersModule,
  ],
})
export class AppModule {}
