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

  test('service should be properly initialized', () => {
    expect(service).toBeDefined();
  });

  describe('Audit Log Creation', () => {
    test('CREATE LOG: Should create new audit log entry with user, action, and task details', async () => {
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

  describe('Audit Log Retrieval', () => {
    test('GET ALL LOGS: Should retrieve complete audit log history without filtering', async () => {
      const result = await service.findAll();

      expect(result).toEqual([mockAuditLog]);
      expect(auditLogRepository.createQueryBuilder).toHaveBeenCalled();
    });

    test('GET USER LOGS: Should retrieve audit logs filtered by specific user actions', async () => {
      const result = await service.findAll(1);

      expect(result).toEqual([mockAuditLog]);
      const queryBuilder = auditLogRepository.createQueryBuilder('audit_log');
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'audit_log.userId = :userId',
        { userId: 1 }
      );
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
