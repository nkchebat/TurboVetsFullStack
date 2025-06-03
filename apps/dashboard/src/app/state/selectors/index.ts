import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState } from '../reducers/task.reducer';
import { AuthState } from '../reducers/auth.reducer';

// Feature selectors
export const selectTaskState = createFeatureSelector<TaskState>('tasks');
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// Task selectors
export const selectAllTasks = createSelector(
  selectTaskState,
  (state: TaskState) => state.tasks
);

export const selectLoading = createSelector(
  selectTaskState,
  (state: TaskState) => state.loading
);

export const selectError = createSelector(
  selectTaskState,
  (state: TaskState) => state.error
);

// Auth selectors
export const selectUserRole = createSelector(
  selectAuthState,
  (state: AuthState) => state.userRole
);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  (state: AuthState) => state.isLoggedIn
);

export const selectIsOwnerOrAdmin = createSelector(
  selectUserRole,
  (role) => role === 'Owner' || role === 'Admin'
);
