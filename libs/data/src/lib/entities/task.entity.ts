import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

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

  @ManyToOne(() => User, (user) => user.tasks)
  owner: User;

  @ManyToOne(() => Organization, (organization) => organization.tasks)
  organization: Organization;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
