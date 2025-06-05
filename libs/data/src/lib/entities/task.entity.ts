import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskCategory =
  | 'Work'
  | 'Personal'
  | 'Shopping'
  | 'Health'
  | 'Other';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'varchar',
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  })
  status: TaskStatus;

  @Column({
    type: 'varchar',
    enum: ['Work', 'Personal', 'Shopping', 'Health', 'Other'],
    default: 'Work',
  })
  category: TaskCategory;

  @ManyToOne(() => User, (user) => user.tasks)
  owner: User;

  @ManyToOne(() => Organization, (organization) => organization.tasks)
  organization: Organization;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
