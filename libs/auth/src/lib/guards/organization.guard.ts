import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@turbovets/data';

@Injectable()
export class OrganizationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceOrgId =
      request.params.organizationId || request.body.organizationId;

    if (user.role === UserRole.OWNER) {
      return true;
    }

    return user.organizationId === resourceOrgId;
  }
}
