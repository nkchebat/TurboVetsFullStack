import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class OrgGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user exists and has required properties
    if (!user || !user.organization) {
      return false;
    }

    // Get organizationId from request body, params, or query
    const targetOrgId =
      request.body?.organizationId ||
      request.params?.organizationId ||
      request.query?.organizationId;

    if (!targetOrgId) {
      return true; // If no org ID is specified, allow access
    }

    // For Owner role, allow access to any organization
    if (user.role === 'Owner') {
      return true;
    }

    // For other roles, check if user belongs to the target organization
    return user.organization.id === parseInt(targetOrgId);
  }
}
