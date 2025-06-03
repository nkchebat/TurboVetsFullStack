import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, Task, AuditLog } from '@turbovets/data';

export const TestDatabaseModule = TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  entities: [User, Organization, Task, AuditLog],
  synchronize: true,
  dropSchema: true,
});
