import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({
    type: 'varchar',
    enum: ['CREATE', 'UPDATE', 'DELETE'],
  })
  action: AuditAction;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ nullable: true })
  taskId: number;

  @Column({ type: 'text' })
  details: string;
}
