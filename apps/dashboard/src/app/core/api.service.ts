import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export type TaskCategory =
  | 'Work'
  | 'Personal'
  | 'Shopping'
  | 'Health'
  | 'Other';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  category: TaskCategory;
  order?: number;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: number;
    name: string;
  };
}

export interface Organization {
  id: number;
  name: string;
  parentOrg?: Organization | null;
  childOrganizations?: Organization[];
  users?: any[]; // User interface not defined yet
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  taskId: number;
  details: string;
  timestamp: string;
  organizationId?: number;
  organizationName?: string;
}

// Mock data for development - organized by organization
const ORGANIZATION_TASKS: { [orgId: number]: Task[] } = {
  1: [
    {
      id: 1,
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the main branch',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Review pull requests',
      description: 'Review and merge pending pull requests for main branch',
      status: 'IN_PROGRESS',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Schedule main clinic equipment check',
      description: 'Annual maintenance for main clinic equipment',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  2: [
    {
      id: 101,
      title: 'North Branch inventory check',
      description: 'Monthly inventory review for north branch',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 102,
      title: 'Update north branch protocols',
      description: 'Update standard operating procedures',
      status: 'IN_PROGRESS',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  3: [
    {
      id: 201,
      title: 'South Branch staff training',
      description: 'Quarterly training session for south branch staff',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 202,
      title: 'Equipment upgrade planning',
      description: 'Plan equipment upgrades for south branch',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 203,
      title: 'Customer satisfaction survey',
      description: 'Conduct quarterly customer satisfaction survey',
      status: 'DONE',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

// Mock audit log data organized by organization
const ORGANIZATION_AUDIT_LOGS: { [orgId: number]: AuditLog[] } = {
  // Owner-level logs (organization 0 represents Owner/System level)
  0: [
    {
      id: 1000,
      userId: 0,
      action: 'CREATE',
      taskId: 1000,
      details: 'Created system-wide backup policy',
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      organizationId: 0,
      organizationName: 'Owner',
    },
    {
      id: 1001,
      userId: 0,
      action: 'UPDATE',
      taskId: 1001,
      details: 'Updated global security settings',
      timestamp: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
      organizationId: 0,
      organizationName: 'Owner',
    },
    {
      id: 1002,
      userId: 0,
      action: 'CREATE',
      taskId: 1002,
      details: 'Established new branch protocols',
      timestamp: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
      organizationId: 0,
      organizationName: 'Owner',
    },
    {
      id: 1003,
      userId: 0,
      action: 'DELETE',
      taskId: 1003,
      details: 'Removed outdated compliance requirements',
      timestamp: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(), // Over 1 year ago
      organizationId: 0,
      organizationName: 'Owner',
    },
    {
      id: 1004,
      userId: 0,
      action: 'UPDATE',
      taskId: 1004,
      details: 'Annual system maintenance completed',
      timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
      organizationId: 0,
      organizationName: 'Owner',
    },
  ],
  1: [
    {
      id: 1,
      userId: 1,
      action: 'CREATE',
      taskId: 1,
      details: 'Created task: Complete project documentation',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
    {
      id: 2,
      userId: 2,
      action: 'UPDATE',
      taskId: 2,
      details:
        'Updated task status from TODO to IN_PROGRESS: Review pull requests',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
    {
      id: 3,
      userId: 1,
      action: 'DELETE',
      taskId: 99,
      details: 'Deleted task: Old maintenance task',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
    {
      id: 4,
      userId: 3,
      action: 'CREATE',
      taskId: 3,
      details: 'Created task: Schedule main clinic equipment check',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
    {
      id: 5,
      userId: 2,
      action: 'UPDATE',
      taskId: 5,
      details: 'Updated weekly schedule for main clinic',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
    {
      id: 6,
      userId: 1,
      action: 'CREATE',
      taskId: 6,
      details: 'Created quarterly review process',
      timestamp: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
    {
      id: 7,
      userId: 3,
      action: 'DELETE',
      taskId: 7,
      details: 'Removed obsolete training materials',
      timestamp: new Date(Date.now() - 450 * 24 * 60 * 60 * 1000).toISOString(), // Over 1 year ago
      organizationId: 1,
      organizationName: 'TurboVets Main',
    },
  ],
  2: [
    {
      id: 101,
      userId: 4,
      action: 'CREATE',
      taskId: 101,
      details: 'Created task: North Branch inventory check',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      organizationId: 2,
      organizationName: 'TurboVets North Branch',
    },
    {
      id: 102,
      userId: 4,
      action: 'UPDATE',
      taskId: 102,
      details: 'Updated task description: Update north branch protocols',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
      organizationId: 2,
      organizationName: 'TurboVets North Branch',
    },
    {
      id: 103,
      userId: 4,
      action: 'CREATE',
      taskId: 103,
      details: 'Implemented new patient intake system',
      timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 1.5 months ago
      organizationId: 2,
      organizationName: 'TurboVets North Branch',
    },
    {
      id: 104,
      userId: 4,
      action: 'UPDATE',
      taskId: 104,
      details: 'Updated staff schedules for holidays',
      timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 3+ months ago
      organizationId: 2,
      organizationName: 'TurboVets North Branch',
    },
    {
      id: 105,
      userId: 4,
      action: 'DELETE',
      taskId: 105,
      details: 'Removed old equipment records',
      timestamp: new Date(Date.now() - 380 * 24 * 60 * 60 * 1000).toISOString(), // Over 1 year ago
      organizationId: 2,
      organizationName: 'TurboVets North Branch',
    },
  ],
  3: [
    {
      id: 201,
      userId: 5,
      action: 'UPDATE',
      taskId: 203,
      details: 'Completed task: Customer satisfaction survey',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      organizationId: 3,
      organizationName: 'TurboVets South Branch',
    },
    {
      id: 202,
      userId: 5,
      action: 'CREATE',
      taskId: 201,
      details: 'Created task: South Branch staff training',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      organizationId: 3,
      organizationName: 'TurboVets South Branch',
    },
    {
      id: 203,
      userId: 5,
      action: 'UPDATE',
      taskId: 202,
      details: 'Updated emergency procedures',
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
      organizationId: 3,
      organizationName: 'TurboVets South Branch',
    },
    {
      id: 204,
      userId: 5,
      action: 'CREATE',
      taskId: 204,
      details: 'Established client feedback system',
      timestamp: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 5 months ago
      organizationId: 3,
      organizationName: 'TurboVets South Branch',
    },
    {
      id: 205,
      userId: 5,
      action: 'DELETE',
      taskId: 205,
      details: 'Archived old patient records',
      timestamp: new Date(Date.now() - 420 * 24 * 60 * 60 * 1000).toISOString(), // Over 1 year ago
      organizationId: 3,
      organizationName: 'TurboVets South Branch',
    },
  ],
};

// Mock user data for audit log display
const MOCK_USERS: { [userId: number]: { name: string; email: string } } = {
  0: { name: 'Owner', email: 'owner@turbovets.com' },
  1: { name: 'Sarah Johnson', email: 'sarah.johnson@turbovets.com' },
  2: { name: 'Michael Chen', email: 'michael.chen@turbovets.com' },
  3: { name: 'Lisa Rodriguez', email: 'lisa.rodriguez@turbovets.com' },
  4: { name: 'Emily Davis', email: 'emily.davis@turbovets.com' },
  5: { name: 'James Wilson', email: 'james.wilson@turbovets.com' },
};

// Mock user role assignments to organizations
const USER_ROLE_ASSIGNMENTS: {
  [userId: number]: { role: string; organizationId: number };
} = {
  0: { role: 'Owner', organizationId: 1 }, // Owner - can access all organizations
  1: { role: 'Admin', organizationId: 1 }, // Sarah - Admin of main org
  2: { role: 'Admin', organizationId: 1 }, // Michael - Admin of main org
  3: { role: 'Viewer', organizationId: 1 }, // Lisa - Viewer of main org
  4: { role: 'Admin', organizationId: 2 }, // Emily - Admin of north branch
  5: { role: 'Admin', organizationId: 3 }, // James - Admin of south branch
};

// Helper function to get the next available task ID for an organization
function getNextTaskId(organizationId: number): number {
  const orgTasks = ORGANIZATION_TASKS[organizationId] || [];
  const allTasks = Object.values(ORGANIZATION_TASKS).flat();
  return Math.max(...allTasks.map((t) => t.id), 0) + 1;
}

const INITIAL_MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 1,
    name: 'TurboVets Main',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parentOrg: null,
    childOrganizations: [],
  },
  {
    id: 2,
    name: 'TurboVets North Branch',
    parentOrg: {
      id: 1,
      name: 'TurboVets Main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    childOrganizations: [],
  },
  {
    id: 3,
    name: 'TurboVets South Branch',
    parentOrg: {
      id: 1,
      name: 'TurboVets Main',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    childOrganizations: [],
  },
];

// Create a mutable copy for runtime modifications
let MOCK_ORGANIZATIONS = [...INITIAL_MOCK_ORGANIZATIONS];

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3001/api';
  private mockMode = false; // Set to false to use real backend
  private currentOrganizationId = 1; // Default organization
  private currentUserRole: string = 'Admin'; // Mock current user role - Admin by default
  private currentUserId: number = 1; // Will be properly set during app initialization

  constructor(private http: HttpClient) {
    // Check localStorage for saved role and set appropriate user ID
    const savedRole = localStorage.getItem('userRole') as string;
    if (savedRole) {
      this.currentUserRole = savedRole;

      // Find a user with the saved role to set as current user
      const userWithRole = Object.entries(USER_ROLE_ASSIGNMENTS).find(
        ([, assignment]) => assignment.role === savedRole
      );

      if (userWithRole) {
        this.currentUserId = parseInt(userWithRole[0]);
        const userAssignment = userWithRole[1];

        // Set organization to user's assigned organization
        this.currentOrganizationId = userAssignment.organizationId;
      }
    }

    console.log('[API SERVICE] Initialized with:');
    console.log('  - API URL:', this.apiUrl);
    console.log('  - Mock Mode:', this.mockMode);
    console.log('  - Current Organization ID:', this.currentOrganizationId);
    console.log('  - Current User Role:', this.currentUserRole);
    console.log('  - Current User ID:', this.currentUserId);
  }

  // Organization management with access control
  setCurrentOrganization(organizationId: number): void {
    console.log(
      '[API SERVICE] Attempting to set current organization to:',
      organizationId
    );

    // Check if user has access to this organization
    if (!this.canAccessOrganization(organizationId)) {
      const error = `Access denied: ${this.currentUserRole} users can only access their assigned organization`;
      console.error('[API SERVICE]', error);
      throw new Error(error);
    }

    console.log(
      '[API SERVICE] Access granted, setting current organization to:',
      organizationId
    );
    this.currentOrganizationId = organizationId;
  }

  getCurrentOrganization(): number {
    return this.currentOrganizationId;
  }

  // Set current user role (for testing role switching)
  setCurrentUserRole(role: string, userId?: number): void {
    console.log('[API SERVICE] Setting current user role to:', role);
    this.currentUserRole = role;

    if (userId) {
      this.currentUserId = userId;
      console.log(
        '[API SERVICE] Updated user ID to:',
        userId,
        'keeping current organization:',
        this.currentOrganizationId
      );
      // NOTE: We no longer force organization changes based on USER_ROLE_ASSIGNMENTS
      // to allow free switching between any role/organization combination for demo purposes
    }
  }

  getCurrentUserRole(): string {
    return this.currentUserRole;
  }

  // Helper method to get child organizations of a given organization
  private getChildOrganizations(organizationId: number): Organization[] {
    return MOCK_ORGANIZATIONS.filter(
      (org) => org.parentOrg?.id === organizationId
    );
  }

  // Helper method to check if an organization is a parent organization
  private isParentOrganization(organizationId: number): boolean {
    return this.getChildOrganizations(organizationId).length > 0;
  }

  // Helper method to check if current user can access child organization tasks
  private canAccessChildOrganizationTasks(): boolean {
    // Only Owner role users can access child organization tasks
    if (this.currentUserRole !== 'Owner') {
      return false;
    }

    // And only if they are at a parent organization
    return this.isParentOrganization(this.currentOrganizationId);
  }

  // Check if current user can access a specific organization
  canAccessOrganization(organizationId: number): boolean {
    // For demo purposes, allow access to any organization regardless of role
    // In a real application, this would have proper access control
    return true;
  }

  // Get organizations that current user can access
  getAccessibleOrganizations(): Organization[] {
    // For demo purposes, always return all organizations to allow free switching
    // In a real application, this would be filtered based on user permissions
    return [...MOCK_ORGANIZATIONS];
  }

  // Organization endpoints
  getOrganizations(): Observable<Organization[]> {
    console.log('[API SERVICE] getOrganizations() called');
    if (this.mockMode) {
      console.log('[API SERVICE] Using mock organizations');
      const accessibleOrgs = this.getAccessibleOrganizations();
      return of(accessibleOrgs).pipe(
        tap(() =>
          console.log(
            '[API SERVICE] Returning accessible organizations:',
            accessibleOrgs
          )
        ),
        delay(300)
      );
    }

    const url = `${this.apiUrl}/organizations`;
    console.log('[API SERVICE] Making HTTP GET request to:', url);
    return this.http.get<Organization[]>(url).pipe(
      tap({
        next: (orgs) =>
          console.log('[API SERVICE] HTTP request successful:', orgs),
        error: (error) =>
          console.error('[API SERVICE] HTTP request failed:', error),
      })
    );
  }

  createOrganization(org: Partial<Organization>): Observable<Organization> {
    console.log('[API SERVICE] createOrganization() called with:', org);
    if (this.mockMode) {
      const newOrg: Organization = {
        id: Math.max(...MOCK_ORGANIZATIONS.map((o) => o.id), 0) + 1,
        name: org.name!,
        parentOrg: org.parentOrg || null,
        childOrganizations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Create a new array instead of pushing to the existing one
      MOCK_ORGANIZATIONS = [...MOCK_ORGANIZATIONS, newOrg];

      // Initialize empty task array for the new organization
      ORGANIZATION_TASKS[newOrg.id] = [];

      console.log('[API SERVICE] Created new mock organization:', newOrg);
      console.log(
        '[API SERVICE] Initialized empty task array for organization:',
        newOrg.id
      );
      return of(newOrg).pipe(delay(300));
    }
    return this.http.post<Organization>(`${this.apiUrl}/organizations`, org);
  }

  // Task endpoints with organization access control
  getTasks(): Observable<Task[]> {
    console.log(
      '[API SERVICE] getTasks() called for organization:',
      this.currentOrganizationId,
      'with role:',
      this.currentUserRole
    );

    if (this.mockMode) {
      console.log('[API SERVICE] Using mock data');

      let tasksToReturn: Task[] = [];

      // Check if current user can access child organization tasks
      if (this.canAccessChildOrganizationTasks()) {
        // Owner at parent org can see tasks from their org + all child organizations
        console.log(
          '[API SERVICE] Owner at parent org - loading tasks from current org and child orgs'
        );

        // Get current organization tasks
        const currentOrgTasks =
          ORGANIZATION_TASKS[this.currentOrganizationId] || [];
        const currentOrg = MOCK_ORGANIZATIONS.find(
          (o) => o.id === this.currentOrganizationId
        );

        // Add current org tasks
        tasksToReturn = currentOrgTasks.map((task) => ({
          ...task,
          organization: currentOrg
            ? { id: currentOrg.id, name: currentOrg.name }
            : undefined,
        }));

        // Add child organization tasks
        const childOrgs = this.getChildOrganizations(
          this.currentOrganizationId
        );
        for (const childOrg of childOrgs) {
          const childOrgTasks = ORGANIZATION_TASKS[childOrg.id] || [];
          const childTasksWithOrg = childOrgTasks.map((task) => ({
            ...task,
            organization: { id: childOrg.id, name: childOrg.name },
          }));
          tasksToReturn = [...tasksToReturn, ...childTasksWithOrg];
        }
      } else {
        // All other users (Admin/Viewer at any org, or Owner at child org) only see tasks from their current organization
        console.log(
          '[API SERVICE] Non-owner user or owner at child org - loading single org tasks'
        );

        const orgTasks = ORGANIZATION_TASKS[this.currentOrganizationId] || [];
        const org = MOCK_ORGANIZATIONS.find(
          (o) => o.id === this.currentOrganizationId
        );
        tasksToReturn = orgTasks.map((task) => ({
          ...task,
          organization: org ? { id: org.id, name: org.name } : undefined,
        }));
      }

      console.log('[API SERVICE] Returning tasks:', tasksToReturn);
      return of(tasksToReturn).pipe(delay(500));
    }

    // Build query parameters for real backend
    const params = new URLSearchParams({
      organizationId: this.currentOrganizationId.toString(),
      userRole: this.currentUserRole,
    });

    const url = `${this.apiUrl}/tasks?${params.toString()}`;
    console.log('[API SERVICE] Making HTTP GET request to:', url);
    return this.http.get<Task[]>(url).pipe(
      tap({
        next: (tasks) =>
          console.log('[API SERVICE] HTTP request successful:', tasks),
        error: (error) =>
          console.error('[API SERVICE] HTTP request failed:', error),
      })
    );
  }

  // Get tasks with optional organization filter (for cross-org users)
  getTasksWithFilter(targetOrganizationId?: number): Observable<Task[]> {
    console.log(
      '[API SERVICE] getTasksWithFilter() called with target org:',
      targetOrganizationId
    );

    if (this.mockMode) {
      // Use the same mock logic as getTasks() but with filtering
      let tasksToReturn: Task[] = [];

      // Check if current user can access child organization tasks
      if (this.canAccessChildOrganizationTasks()) {
        // Owner at parent org can see tasks from their org + child organizations
        if (targetOrganizationId) {
          // Filter to specific organization (must be current org or a child org)
          const childOrgs = this.getChildOrganizations(
            this.currentOrganizationId
          );
          const isAccessibleOrg =
            targetOrganizationId === this.currentOrganizationId ||
            childOrgs.some((org) => org.id === targetOrganizationId);

          if (isAccessibleOrg) {
            const orgTasks = ORGANIZATION_TASKS[targetOrganizationId] || [];
            const org = MOCK_ORGANIZATIONS.find(
              (o) => o.id === targetOrganizationId
            );
            tasksToReturn = orgTasks.map((task) => ({
              ...task,
              organization: org ? { id: org.id, name: org.name } : undefined,
            }));
          } else {
            // Access denied to this organization
            tasksToReturn = [];
          }
        } else {
          // Show all tasks from current org + child organizations
          // Get current organization tasks
          const currentOrgTasks =
            ORGANIZATION_TASKS[this.currentOrganizationId] || [];
          const currentOrg = MOCK_ORGANIZATIONS.find(
            (o) => o.id === this.currentOrganizationId
          );

          tasksToReturn = currentOrgTasks.map((task) => ({
            ...task,
            organization: currentOrg
              ? { id: currentOrg.id, name: currentOrg.name }
              : undefined,
          }));

          // Add child organization tasks
          const childOrgs = this.getChildOrganizations(
            this.currentOrganizationId
          );
          for (const childOrg of childOrgs) {
            const childOrgTasks = ORGANIZATION_TASKS[childOrg.id] || [];
            const childTasksWithOrg = childOrgTasks.map((task) => ({
              ...task,
              organization: { id: childOrg.id, name: childOrg.name },
            }));
            tasksToReturn = [...tasksToReturn, ...childTasksWithOrg];
          }
        }
      } else {
        // Fall back to regular single-org access
        return this.getTasks();
      }

      console.log('[API SERVICE] Returning filtered tasks:', tasksToReturn);
      return of(tasksToReturn).pipe(delay(500));
    }

    // Build query parameters for real backend
    const params = new URLSearchParams({
      organizationId: this.currentOrganizationId.toString(),
      userRole: this.currentUserRole,
    });

    if (targetOrganizationId) {
      params.set('targetOrgId', targetOrganizationId.toString());
    }

    const url = `${this.apiUrl}/tasks?${params.toString()}`;
    console.log('[API SERVICE] Making HTTP GET request to:', url);
    return this.http.get<Task[]>(url).pipe(
      tap({
        next: (tasks) =>
          console.log('[API SERVICE] HTTP request successful:', tasks),
        error: (error) =>
          console.error('[API SERVICE] HTTP request failed:', error),
      })
    );
  }

  getTask(id: number): Observable<Task> {
    console.log(
      '[API SERVICE] getTask() called for:',
      id,
      'in organization:',
      this.currentOrganizationId
    );
    if (this.mockMode) {
      const task = ORGANIZATION_TASKS[this.currentOrganizationId]?.find(
        (t) => t.id === id
      );
      if (!task) {
        throw new Error('Task not found');
      }
      return of({ ...task });
    }
    return this.http.get<Task>(
      `${this.apiUrl}/tasks/${id}?organizationId=${this.currentOrganizationId}`
    );
  }

  // Helper method to create audit log entries
  private addAuditLog(action: string, taskId: number, details: string): void {
    let userId: number;
    let userName: string;
    let organizationId: number;
    let organizationName: string;

    if (this.currentUserRole === 'Owner') {
      // Owner Rule: Use ID 0, name "Owner", organization "Owner" with ID 0
      userId = 0;
      userName = 'Owner';
      organizationId = 0;
      organizationName = 'Owner';
    } else if (this.currentUserRole === 'Admin') {
      // Admin Rule: Use admin user ID and organization details from currently selected organization
      const currentOrg = MOCK_ORGANIZATIONS.find(
        (org) => org.id === this.currentOrganizationId
      );

      // Get the admin user for the current organization from USER_ROLE_ASSIGNMENTS
      const adminUserEntry = Object.entries(USER_ROLE_ASSIGNMENTS).find(
        ([, assignment]) =>
          assignment.role === 'Admin' &&
          assignment.organizationId === this.currentOrganizationId
      );

      if (adminUserEntry) {
        const adminUserId = parseInt(adminUserEntry[0]);
        const adminUserInfo = MOCK_USERS[adminUserId];

        userId = adminUserId;
        userName = adminUserInfo?.name || `Admin User ${adminUserId}`;
        organizationId = this.currentOrganizationId;
        organizationName = currentOrg?.name || 'Unknown Organization';
      } else {
        // Fallback if no admin found for current organization
        userId = this.currentUserId;
        userName =
          MOCK_USERS[this.currentUserId]?.name || `User ${this.currentUserId}`;
        organizationId = this.currentOrganizationId;
        organizationName = currentOrg?.name || 'Unknown Organization';
      }
    } else {
      // For other roles (Viewer), use current user context
      const currentOrg = MOCK_ORGANIZATIONS.find(
        (org) => org.id === this.currentOrganizationId
      );

      userId = this.currentUserId;
      userName =
        MOCK_USERS[this.currentUserId]?.name || `User ${this.currentUserId}`;
      organizationId = this.currentOrganizationId;
      organizationName = currentOrg?.name || 'Unknown Organization';
    }

    // Get next audit log ID
    const allAuditLogs = Object.values(ORGANIZATION_AUDIT_LOGS).flat();
    const nextId = Math.max(...allAuditLogs.map((log) => log.id), 0) + 1;

    const auditLog: AuditLog = {
      id: nextId,
      userId,
      action,
      taskId,
      details,
      timestamp: new Date().toISOString(),
      organizationId,
      organizationName,
    };

    // Add to appropriate organization's audit logs
    if (!ORGANIZATION_AUDIT_LOGS[organizationId]) {
      ORGANIZATION_AUDIT_LOGS[organizationId] = [];
    }
    ORGANIZATION_AUDIT_LOGS[organizationId].unshift(auditLog); // Add to beginning for newest first

    console.log('[API SERVICE] Added audit log:', auditLog);
    console.log(
      `[API SERVICE] Audit rule applied - Role: ${this.currentUserRole}, User ID: ${userId}, User Name: ${userName}, Org: ${organizationName} (${organizationId})`
    );
  }

  createTask(task: Partial<Task>): Observable<Task> {
    // Determine which organization to use - task's organizationId takes precedence for cross-org operations
    const targetOrgId = (task as any).organizationId
      ? parseInt((task as any).organizationId.toString())
      : this.currentOrganizationId;

    console.log(
      '[API SERVICE] createTask() called for organization:',
      this.currentOrganizationId,
      'target organization:',
      targetOrgId,
      'with:',
      task
    );
    if (this.mockMode) {
      const org = MOCK_ORGANIZATIONS.find(
        (o) => o.id === this.currentOrganizationId
      );
      const newTask: Task = {
        id: getNextTaskId(this.currentOrganizationId),
        title: task.title!,
        description: task.description,
        status: task.status || 'TODO',
        category: task.category || 'Work',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        organization: org ? { id: org.id, name: org.name } : undefined,
      };

      // Add new task to the beginning of the list so it appears at the top
      ORGANIZATION_TASKS[this.currentOrganizationId] = [
        { ...newTask, organization: undefined }, // Store without organization in ORGANIZATION_TASKS
        ...(ORGANIZATION_TASKS[this.currentOrganizationId] || []),
      ];

      // Add audit log
      this.addAuditLog('CREATE', newTask.id, `Created task: ${newTask.title}`);

      console.log('[API SERVICE] Created new mock task:', newTask);
      return of(newTask).pipe(delay(300));
    }

    return this.http.post<Task>(
      `${this.apiUrl}/tasks?organizationId=${targetOrgId}&userRole=${this.currentUserRole}`,
      task
    );
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    // Determine which organization to use - task's organizationId takes precedence for cross-org operations
    const targetOrgId = (task as any).organizationId
      ? parseInt((task as any).organizationId.toString())
      : this.currentOrganizationId;

    console.log(
      '[API SERVICE] updateTask() called for:',
      id,
      'in organization:',
      this.currentOrganizationId,
      'target organization:',
      targetOrgId
    );
    console.log('[API SERVICE] Update data:', task);
    console.log(
      '[API SERVICE] Update data JSON:',
      JSON.stringify(task, null, 2)
    );
    if (this.mockMode) {
      console.log(
        '[API SERVICE] Current organization tasks:',
        ORGANIZATION_TASKS[this.currentOrganizationId]
      );
      const orgTasks = ORGANIZATION_TASKS[this.currentOrganizationId] || [];
      const index = orgTasks.findIndex((t) => t.id === id);
      console.log('[API SERVICE] Found task at index:', index);
      if (index !== -1 && index !== undefined) {
        const originalTask = orgTasks[index];
        console.log('[API SERVICE] Original task before update:', originalTask);
        const updatedTask: Task = {
          ...originalTask,
          ...task,
          updatedAt: new Date().toISOString(),
        };

        // Create a new array instead of mutating the existing one
        const newOrgTasks = [...orgTasks];
        newOrgTasks[index] = updatedTask;
        ORGANIZATION_TASKS[this.currentOrganizationId] = newOrgTasks;

        // Add audit log
        const changes = [];
        if (task.title && task.title !== originalTask.title) {
          changes.push(`title from "${originalTask.title}" to "${task.title}"`);
        }
        if (task.status && task.status !== originalTask.status) {
          changes.push(`status from ${originalTask.status} to ${task.status}`);
        }
        if (
          task.description !== undefined &&
          task.description !== originalTask.description
        ) {
          changes.push(`description`);
        }
        const details =
          changes.length > 0
            ? `Updated task ${changes.join(', ')}: ${updatedTask.title}`
            : `Updated task: ${updatedTask.title}`;

        this.addAuditLog('UPDATE', updatedTask.id, details);

        console.log('[API SERVICE] Updated mock task:', updatedTask);
        console.log(
          '[API SERVICE] Updated organization tasks:',
          ORGANIZATION_TASKS[this.currentOrganizationId]
        );
        return of(updatedTask).pipe(delay(300));
      }
      console.error('[API SERVICE] Task not found for update, ID:', id);
      console.error(
        '[API SERVICE] Available task IDs:',
        orgTasks?.map((t) => t.id)
      );
      throw new Error('Task not found');
    }

    return this.http.put<Task>(
      `${this.apiUrl}/tasks/${id}?organizationId=${targetOrgId}&userRole=${this.currentUserRole}`,
      task
    );
  }

  updateTaskOrder(id: number, order: number): Observable<Task> {
    console.log(
      '[API SERVICE] updateTaskOrder() called for:',
      id,
      'with order:',
      order
    );
    if (this.mockMode) {
      const task = ORGANIZATION_TASKS[this.currentOrganizationId]?.find(
        (t) => t.id === id
      );
      if (task) {
        task.order = order;

        // Add audit log
        this.addAuditLog(
          'UPDATE',
          task.id,
          `Updated task order: ${task.title}`
        );

        console.log('[API SERVICE] Updated mock task order:', { id, order });
        return of({ ...task }).pipe(delay(300));
      }
      throw new Error('Task not found');
    }
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/order`, {
      order,
      organizationId: this.currentOrganizationId,
    });
  }

  deleteTask(id: number): Observable<void> {
    console.log(
      '[API SERVICE] deleteTask() called for:',
      id,
      'in organization:',
      this.currentOrganizationId
    );
    if (this.mockMode) {
      const orgTasks = ORGANIZATION_TASKS[this.currentOrganizationId] || [];
      const taskToDelete = orgTasks.find((task) => task.id === id);
      const index = orgTasks.findIndex((t) => t.id === id);
      if (index !== -1 && taskToDelete) {
        // Add audit log before deleting
        this.addAuditLog(
          'DELETE',
          taskToDelete.id,
          `Deleted task: ${taskToDelete.title}`
        );

        // Create a new array without the deleted task instead of using splice
        const newOrgTasks = orgTasks.filter((task) => task.id !== id);
        ORGANIZATION_TASKS[this.currentOrganizationId] = newOrgTasks;
        console.log('[API SERVICE] Deleted mock task:', id);
        return of(void 0).pipe(delay(300));
      }
      throw new Error('Task not found');
    }
    return this.http.delete<void>(
      `${this.apiUrl}/tasks/${id}?organizationId=${this.currentOrganizationId}&userRole=${this.currentUserRole}`
    );
  }

  // Audit log endpoints with enhanced organization info
  getAuditLogs(): Observable<AuditLog[]> {
    console.log(
      '[API SERVICE] getAuditLogs() called for organization:',
      this.currentOrganizationId
    );

    // Check access before returning audit logs
    if (!this.canAccessOrganization(this.currentOrganizationId)) {
      console.error('[API SERVICE] Access denied to organization audit logs');
      throw new Error(
        `Access denied: Cannot view audit logs from organization ${this.currentOrganizationId}`
      );
    }

    if (this.mockMode) {
      // Return audit logs for the current organization
      const orgAuditLogs =
        ORGANIZATION_AUDIT_LOGS[this.currentOrganizationId] || [];
      console.log('[API SERVICE] Returning mock audit logs:', orgAuditLogs);
      return of(orgAuditLogs).pipe(delay(300));
    }
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/audit-logs?organizationId=${this.currentOrganizationId}`
    );
  }

  // Get user information for audit log display
  getUserInfo(userId: number): { name: string; email: string } | null {
    return MOCK_USERS[userId] || null;
  }

  // Get all audit logs (Owner only)
  getAllAuditLogs(): Observable<AuditLog[]> {
    console.log('[API SERVICE] getAllAuditLogs() called - Owner access');

    if (this.currentUserRole !== 'Owner') {
      console.error(
        '[API SERVICE] Access denied - Only Owners can view all audit logs'
      );
      throw new Error(
        'Access denied: Only Owners can view system-wide audit logs'
      );
    }

    if (this.mockMode) {
      // Return all audit logs from all organizations for Owner role
      const allLogs = Object.values(ORGANIZATION_AUDIT_LOGS).flat();
      console.log('[API SERVICE] Returning all audit logs:', allLogs);
      return of(allLogs).pipe(delay(300));
    }
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs/all`);
  }
}
