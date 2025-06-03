import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '@turbovets/data';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogRepository: Repository<AuditLog>;
  let queryBuilder: any;

  const mockAuditLog: AuditLog = {
    id: 1,
    userId: 1,
    action: 'CREATE' as AuditAction,
    taskId: 1,
    details: 'Test audit log',
    timestamp: new Date(),
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockAuditLog]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: {
            create: jest.fn().mockReturnValue(mockAuditLog),
            save: jest.fn().mockResolvedValue(mockAuditLog),
            find: jest.fn().mockResolvedValue([mockAuditLog]),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    auditLogRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog)
    );
  });

  test('service should be properly initialized', () => {
    expect(service).toBeDefined();
  });

  describe('Audit Log Creation', () => {
    test('CREATE LOG: Should create new audit log entry with user, action, and task details', async () => {
      const result = await service.log(
        1,
        'CREATE' as AuditAction,
        1,
        'Test log'
      );

      expect(result).toEqual(mockAuditLog);
      expect(auditLogRepository.create).toHaveBeenCalledWith({
        userId: 1,
        action: 'CREATE' as AuditAction,
        taskId: 1,
        details: 'Test log',
        timestamp: expect.any(Date),
      });
    });
  });

  describe('Audit Log Retrieval', () => {
    test('GET ALL LOGS: Should retrieve complete audit log history without filtering', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'audit_log.timestamp',
        'DESC'
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(100);
    });

    test('GET USER LOGS: Should retrieve audit logs filtered by specific user actions', async () => {
      const result = await service.findAll(1);

      expect(result).toEqual([mockAuditLog]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'audit_log.userId = :userId',
        { userId: 1 }
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'audit_log.timestamp',
        'DESC'
      );
      expect(queryBuilder.take).toHaveBeenCalledWith(100);
    });
  });

  describe('Task-Specific Audit Logs', () => {
    test('GET TASK LOGS: Should retrieve chronological audit history for specific task', async () => {
      const result = await service.findByTask(1);

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { taskId: 1 },
        order: { timestamp: 'DESC' },
      });
    });
  });
});
