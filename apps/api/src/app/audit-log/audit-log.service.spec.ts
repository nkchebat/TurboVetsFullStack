import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@turbovets/data';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: Repository<AuditLog>;

  const mockAuditLog: AuditLog = {
    id: 1,
    userId: 1,
    action: 'CREATE',
    taskId: 1,
    details: 'Test audit log',
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn().mockReturnValue(mockAuditLog),
            save: jest.fn().mockResolvedValue(mockAuditLog),
            find: jest.fn().mockResolvedValue([mockAuditLog]),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockAuditLog]),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const result = await service.log(1, 'CREATE', 1, 'Test log');

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'CREATE',
        taskId: 1,
        details: 'Test log',
      });
    });
  });

  describe('findAll', () => {
    it('should return all audit logs when no userId provided', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should return filtered audit logs when userId provided', async () => {
      const result = await service.findAll(1);

      expect(result).toEqual([mockAuditLog]);
      const queryBuilder = auditLogRepository.createQueryBuilder('audit_log');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'audit_log.userId = :userId',
        { userId: 1 }
      );
    });
  });

  describe('findByTask', () => {
    it('should return audit logs for a specific task', async () => {
      const result = await service.findByTask(1);

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { taskId: 1 },
        order: { timestamp: 'DESC' },
      });
    });
  });
});
