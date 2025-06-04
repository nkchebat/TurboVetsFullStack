import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@turbovets/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (
    userRole: UserRole,
    requiredRoles?: UserRole[]
  ) => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { role: userRole, id: 1, organization: { id: 1 } },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('Role-Based Access Control', () => {
    it('should allow access when no roles are required', () => {
      const context = mockExecutionContext('Viewer');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow Owner access to Owner-required routes', () => {
      const context = mockExecutionContext('Owner');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Owner']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow Admin access to Admin-required routes', () => {
      const context = mockExecutionContext('Admin');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow Owner access to Admin-required routes', () => {
      const context = mockExecutionContext('Owner');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny Viewer access to Admin-required routes', () => {
      const context = mockExecutionContext('Viewer');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny Admin access to Owner-only routes', () => {
      const context = mockExecutionContext('Admin');
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Owner']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should allow access when user role matches any of multiple required roles', () => {
      const context = mockExecutionContext('Admin');
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['Owner', 'Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user role does not match any required roles', () => {
      const context = mockExecutionContext('Viewer');
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(['Owner', 'Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user: undefined }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should handle missing user role gracefully', () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user: { id: 1 } }),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
