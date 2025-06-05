import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '@turbovets/data';

export const PERMISSIONS_KEY = 'permissions';
export type Permission = 'read' | 'write' | 'admin';

@Injectable()
export class OrganizationHierarchyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organization) {
      return false;
    }

    // Get the target organization ID from various sources
    const targetOrgId = this.extractOrganizationId(request);

    if (!targetOrgId) {
      return true; // No specific org targeted, let other guards handle
    }

    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    return this.checkAccess(user, targetOrgId, requiredPermissions);
  }

  private extractOrganizationId(request: any): number | null {
    const orgId =
      request.params?.organizationId ||
      request.query?.organizationId ||
      request.body?.organizationId;

    return orgId ? parseInt(orgId, 10) : null;
  }

  private async checkAccess(
    user: any,
    targetOrgId: number,
    requiredPermissions: Permission[] = ['read']
  ): Promise<boolean> {
    const userOrgId = user.organization.id;
    const userRole = user.role;

    // Check if user has permission for the required action
    if (!this.hasPermissionForAction(userRole, requiredPermissions)) {
      return false;
    }

    // Same organization - all roles can access (with their permission level)
    if (userOrgId === targetOrgId) {
      return true;
    }

    // Only Owners can access other organizations (children only)
    if (userRole !== 'Owner') {
      return false;
    }

    // Check if target organization is a child of user's organization
    return this.isChildOrganization(userOrgId, targetOrgId);
  }

  private hasPermissionForAction(
    userRole: string,
    requiredPermissions: Permission[]
  ): boolean {
    const rolePermissions = {
      Owner: ['read', 'write', 'admin'],
      Admin: ['read', 'write'],
      Viewer: ['read'],
    };

    const userPermissions = rolePermissions[userRole] || [];

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
  }

  private async isChildOrganization(
    parentOrgId: number,
    childOrgId: number
  ): Promise<boolean> {
    // Find all child organizations recursively
    const childOrgs = await this.findAllChildOrganizations(parentOrgId);
    return childOrgs.some((org) => org.id === childOrgId);
  }

  private async findAllChildOrganizations(
    parentOrgId: number
  ): Promise<Organization[]> {
    const allChildren: Organization[] = [];
    const queue = [parentOrgId];

    while (queue.length > 0) {
      const currentParentId = queue.shift()!;

      const children = await this.orgRepository.find({
        where: { parentOrg: { id: currentParentId } },
      });

      for (const child of children) {
        allChildren.push(child);
        queue.push(child.id); // Add to queue for recursive search
      }
    }

    return allChildren;
  }
}
