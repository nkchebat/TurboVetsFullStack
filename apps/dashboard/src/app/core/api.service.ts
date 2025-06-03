import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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
const mockTasks: Task[] = [
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
];

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = '/api';
  private mockMode = true; // Toggle this for development
  private mockTasks: Task[] = mockTasks;

  constructor(private http: HttpClient) {}

  // Task endpoints
  getTasks(): Observable<Task[]> {
    if (this.mockMode) {
      console.log('Returning mock tasks:', this.mockTasks);
      return of([...this.mockTasks]);
    }
    return this.http.get<Task[]>(`${this.apiUrl}/tasks`);
  }

  getTask(id: number): Observable<Task> {
    if (this.mockMode) {
      const task = this.mockTasks.find((t) => t.id === id);
      return of({ ...task! });
    }
    return this.http.get<Task>(`${this.apiUrl}/tasks/${id}`);
  }

  createTask(task: Partial<Task>): Observable<Task> {
    if (this.mockMode) {
      const newTask: Task = {
        ...task,
        id: Math.max(...this.mockTasks.map((t) => t.id), 0) + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Task;
      this.mockTasks.push(newTask);
      console.log('Created mock task:', newTask);
      console.log('Current mock tasks:', this.mockTasks);
      return of({ ...newTask });
    }
    return this.http.post<Task>(`${this.apiUrl}/tasks`, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    if (this.mockMode) {
      const index = this.mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.mockTasks[index] = {
          ...this.mockTasks[index],
          ...task,
          updatedAt: new Date().toISOString(),
        };
        console.log('Updated mock task:', this.mockTasks[index]);
        return of({ ...this.mockTasks[index] });
      }
    }
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}`, task);
  }

  updateTaskOrder(id: number, order: number): Observable<Task> {
    if (this.mockMode) {
      const task = this.mockTasks.find((t) => t.id === id);
      if (task) {
        task.order = order;
        return of({ ...task });
      }
    }
    return this.http.patch<Task>(`${this.apiUrl}/tasks/${id}/order`, { order });
  }

  deleteTask(id: number): Observable<void> {
    if (this.mockMode) {
      const index = this.mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.mockTasks.splice(index, 1);
        console.log('Deleted mock task with id:', id);
        console.log('Current mock tasks:', this.mockTasks);
      }
      return of(void 0);
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
