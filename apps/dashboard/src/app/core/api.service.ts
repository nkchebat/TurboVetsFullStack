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

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  taskId: number;
  details: string;
  timestamp: string;
}

// Mock data for development
const INITIAL_MOCK_TASKS: Task[] = [
  {
    id: 1,
    title: 'Complete project documentation',
    description: 'Write comprehensive documentation for the project',
    status: 'TODO',
    category: 'Work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Review pull requests',
    description: 'Review and merge pending pull requests',
    status: 'IN_PROGRESS',
    category: 'Work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Schedule Vet Appointment',
    description: 'Book annual checkup for pets',
    status: 'TODO',
    category: 'Personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'Buy groceries',
    description: 'Get weekly groceries from the store',
    status: 'DONE',
    category: 'Shopping',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'Exercise routine',
    description: '30 minutes of cardio',
    status: 'IN_PROGRESS',
    category: 'Health',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost:3001/api';
  private mockMode = false; // Set to false to use real backend

  constructor(private http: HttpClient) {
    console.log('[API SERVICE] Initialized with:');
    console.log('  - API URL:', this.apiUrl);
    console.log('  - Mock Mode:', this.mockMode);
  }

  // Task endpoints
  getTasks(): Observable<Task[]> {
    console.log('[API SERVICE] getTasks() called');
    if (this.mockMode) {
      console.log('[API SERVICE] Using mock data');
      return of(INITIAL_MOCK_TASKS).pipe(
        tap(() => console.log('[API SERVICE] Returning mock tasks')),
        delay(500)
      );
    }

    const url = `${this.apiUrl}/tasks`;
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
    if (this.mockMode) {
      const task = INITIAL_MOCK_TASKS.find((t) => t.id === id);
      if (!task) {
        throw new Error('Task not found');
      }
      return of({ ...task });
    }
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    if (this.mockMode) {
      const newTask: Task = {
        id: Math.max(...INITIAL_MOCK_TASKS.map((t) => t.id), 0) + 1,
        title: task.title!,
        description: task.description,
        status: task.status || 'TODO',
        category: task.category || 'Work',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      INITIAL_MOCK_TASKS.push(newTask);
      console.log('Created new mock task:', newTask);
      return of(newTask);
    }
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    if (this.mockMode) {
      const index = INITIAL_MOCK_TASKS.findIndex((t) => t.id === id);
      if (index !== -1) {
        const updatedTask: Task = {
          ...INITIAL_MOCK_TASKS[index],
          ...task,
          updatedAt: new Date().toISOString(),
        };
        INITIAL_MOCK_TASKS[index] = updatedTask;
        console.log('Updated mock task:', updatedTask);
        return of(updatedTask);
      }
      throw new Error('Task not found');
    }
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, task);
  }

  updateTaskOrder(id: number, order: number): Observable<Task> {
    if (this.mockMode) {
      const task = INITIAL_MOCK_TASKS.find((t) => t.id === id);
      if (task) {
        task.order = order;
        console.log('Updated mock task order:', { id, order });
        return of({ ...task });
      }
      throw new Error('Task not found');
    }
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/order`, { order });
  }

  deleteTask(id: number): Observable<void> {
    if (this.mockMode) {
      const index = INITIAL_MOCK_TASKS.findIndex((t) => t.id === id);
      if (index !== -1) {
        INITIAL_MOCK_TASKS.splice(index, 1);
        console.log('Deleted mock task:', id);
        return of(void 0);
      }
      throw new Error('Task not found');
    }
    return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`);
  }

  // Audit log endpoints
  getAuditLogs(): Observable<AuditLog[]> {
    if (this.mockMode) {
      return of([]);
    }
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`);
  }
}
