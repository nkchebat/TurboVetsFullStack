import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { OrgGuard } from './org.guard';

describe('OrgGuard', () => {
  let guard: OrgGuard;

  const mockExecutionContext = (
    userRole: string,
    userOrgId: number,
    targetOrgId?: number,
    requestType: 'body' | 'params' | 'query' = 'body'
  ) => {
    const orgIdField =
      requestType === 'body'
        ? 'organizationId'
        : requestType === 'params'
        ? 'organizationId'
        : 'organizationId';

    const request: any = {
      user: { role: userRole, organization: { id: userOrgId } },
      body: {},
      params: {},
      query: {},
    };

    if (targetOrgId !== undefined) {
      request[requestType][orgIdField] = targetOrgId;
    }

    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrgGuard],
    }).compile();

    guard = module.get<OrgGuard>(OrgGuard);
  });

  describe('Organization Access Control', () => {
    it('should allow access when no organization ID is specified', () => {
      const context = mockExecutionContext('Admin', 1);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow Owner access to any organization', () => {
      const context = mockExecutionContext('Owner', 1, 2);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow Admin access to their own organization', () => {
      const context = mockExecutionContext('Admin', 1, 1);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny Admin access to different organization', () => {
      const context = mockExecutionContext('Admin', 1, 2);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow Viewer access to their own organization', () => {
      const context = mockExecutionContext('Viewer', 3, 3);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny Viewer access to different organization', () => {
      const context = mockExecutionContext('Viewer', 3, 1);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('Request Parameter Sources', () => {
    it('should check organization ID from request body', () => {
      const context = mockExecutionContext('Admin', 1, 1, 'body');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should check organization ID from request params', () => {
      const context = mockExecutionContext('Admin', 1, 1, 'params');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should check organization ID from request query', () => {
      const context = mockExecutionContext('Admin', 1, 1, 'query');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle string organization IDs correctly', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { role: 'Admin', organization: { id: 1 } },
            body: { organizationId: '1' },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should handle missing user organization gracefully', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { role: 'Admin' },
            body: { organizationId: 1 },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
