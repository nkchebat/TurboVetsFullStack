import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@turbovets/data';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check if user exists and has a role
    if (!user || !user.role) {
      return false;
    }

    // Check if user role matches any required role
    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    // If user has required role, allow access
    if (hasRequiredRole) {
      return true;
    }

    // Implement role hierarchy: Owner can access Admin routes
    if (user.role === 'Owner' && requiredRoles.includes('Admin')) {
      return true;
    }

    return false;
  }
}
