import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { selectIsOwnerOrAdmin } from './state/selectors';

// Route guard for Owner/Admin only routes
const adminGuard = () => {
  const store = inject(Store);
  return store
    .select(selectIsOwnerOrAdmin)
    .pipe(map((isOwnerOrAdmin) => isOwnerOrAdmin || { path: '/tasks' }));
};

export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/task-list/task-list.component').then(
        (m) => m.TaskListComponent
      ),
  },
  {
    path: 'tasks/:id/edit',
    loadComponent: () =>
      import('./features/task-form/task-form.component').then(
        (m) => m.TaskFormComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'audit-log',
    loadComponent: () =>
      import('./features/audit-log/audit-log.component').then(
        (m) => m.AuditLogComponent
      ),
    canActivate: [adminGuard],
  },
];
