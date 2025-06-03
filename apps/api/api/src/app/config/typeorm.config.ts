import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User, Organization, Task } from '@turbovets/data';
import { join } from 'path';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: join(process.cwd(), 'data', 'turbovets.sqlite'),
  entities: [User, Organization, Task],
  synchronize: true, // Set to false in production
  logging: true,
};
