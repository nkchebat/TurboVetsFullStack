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
}

export interface Organization {
  id: number;
  name: string;
  parentOrgId?: number;
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
  },
  {
    id: 2,
    name: 'TurboVets North Branch',
    parentOrgId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'TurboVets South Branch',
    parentOrgId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Create a mutable copy for runtime modifications
let MOCK_ORGANIZATIONS = [...INITIAL_MOCK_ORGANIZATIONS];

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3001/api';
  private mockMode = true; // Set to false to use real backend
  private currentOrganizationId = 1; // Default organization

  constructor(private http: HttpClient) {
    console.log('[API SERVICE] Initialized with:');
    console.log('  - API URL:', this.apiUrl);
    console.log('  - Mock Mode:', this.mockMode);
    console.log('  - Current Organization ID:', this.currentOrganizationId);
  }

  // Organization management
  setCurrentOrganization(organizationId: number): void {
    console.log(
      '[API SERVICE] Setting current organization to:',
      organizationId
    );
    this.currentOrganizationId = organizationId;
  }

  getCurrentOrganization(): number {
    return this.currentOrganizationId;
  }

  // Organization endpoints
  getOrganizations(): Observable<Organization[]> {
    console.log('[API SERVICE] getOrganizations() called');
    if (this.mockMode) {
      console.log('[API SERVICE] Using mock organizations');
      return of([...MOCK_ORGANIZATIONS]).pipe(
        tap(() => console.log('[API SERVICE] Returning mock organizations')),
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
        parentOrgId: org.parentOrgId,
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

  // Task endpoints (updated to include organization context)
  getTasks(): Observable<Task[]> {
    console.log(
      '[API SERVICE] getTasks() called for organization:',
      this.currentOrganizationId
    );
    if (this.mockMode) {
      console.log('[API SERVICE] Using mock data');
      // Filter tasks by organization (for mock, we'll return all for now)
      return of(ORGANIZATION_TASKS[this.currentOrganizationId] || []).pipe(
        tap(() =>
          console.log(
            '[API SERVICE] Returning mock tasks for org:',
            this.currentOrganizationId
          )
        ),
        delay(500)
      );
    }

    const url = `${this.apiUrl}/tasks?organizationId=${this.currentOrganizationId}`;
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

  createTask(task: Partial<Task>): Observable<Task> {
    console.log(
      '[API SERVICE] createTask() called for organization:',
      this.currentOrganizationId,
      'with:',
      task
    );
    if (this.mockMode) {
      const newTask: Task = {
        id: getNextTaskId(this.currentOrganizationId),
        title: task.title!,
        description: task.description,
        status: task.status || 'TODO',
        category: task.category || 'Work',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      ORGANIZATION_TASKS[this.currentOrganizationId] = [
        ...(ORGANIZATION_TASKS[this.currentOrganizationId] || []),
        newTask,
      ];
      console.log('[API SERVICE] Created new mock task:', newTask);
      return of(newTask).pipe(delay(300));
    }

    const taskWithOrg = { ...task, organizationId: this.currentOrganizationId };
    return this.http.post<Task>(`${this.apiUrl}/tasks`, taskWithOrg);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    console.log(
      '[API SERVICE] updateTask() called for:',
      id,
      'in organization:',
      this.currentOrganizationId
    );
    console.log('[API SERVICE] Update data:', task);
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

    const taskWithOrg = { ...task, organizationId: this.currentOrganizationId };
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, taskWithOrg);
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
      const index = orgTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        // Create a new array without the deleted task instead of using splice
        const newOrgTasks = orgTasks.filter((task) => task.id !== id);
        ORGANIZATION_TASKS[this.currentOrganizationId] = newOrgTasks;
        console.log('[API SERVICE] Deleted mock task:', id);
        return of(void 0).pipe(delay(300));
      }
      throw new Error('Task not found');
    }
    return this.http.delete<void>(
      `${this.apiUrl}/tasks/${id}?organizationId=${this.currentOrganizationId}`
    );
  }

  // Audit log endpoints
  getAuditLogs(): Observable<AuditLog[]> {
    console.log(
      '[API SERVICE] getAuditLogs() called for organization:',
      this.currentOrganizationId
    );
    if (this.mockMode) {
      return of([]).pipe(delay(300));
    }
    return this.http.get<AuditLog[]>(
      `${this.apiUrl}/audit-logs?organizationId=${this.currentOrganizationId}`
    );
  }
}
