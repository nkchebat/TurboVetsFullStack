import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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

const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },
  {
    path: 'role-switcher',
    loadComponent: () =>
      import('./features/role-switcher/role-switcher.component').then(
        (m) => m.RoleSwitcherComponent
      ),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/task-list/task-list.component').then(
        (m) => m.TaskListComponent
      ),
  },
  {
    path: 'tasks/new',
    loadComponent: () =>
      import('./features/task-form/task-form.component').then(
        (m) => m.TaskFormComponent
      ),
    canActivate: [adminGuard],
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

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
