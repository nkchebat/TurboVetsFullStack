import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, Task, AuditLog } from '@turbovets/data';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'db.sqlite',
      entities: [User, Organization, Task, AuditLog],
      synchronize: true, // Set to false in production
      logging: true,
    }),
    UsersModule,
    AuthModule,
    TasksModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
