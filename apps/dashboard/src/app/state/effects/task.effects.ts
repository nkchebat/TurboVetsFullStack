import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, switchMap, catchError, tap, mergeMap } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import * as TaskActions from '../actions/task.actions';
import * as AuthActions from '../actions/auth.actions';

@Injectable()
export class TaskEffects {
  // ✅ Using inject() - these are resolved at the right time
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  // ✅ Now this.actions$ and this.apiService are available
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      tap(() => {
        console.log('[EFFECT] loadTasks action received - Starting API call');
        console.log(
          '[EFFECT] Current organization:',
          this.apiService.getCurrentOrganization()
        );
        console.log(
          '[EFFECT] Current user role:',
          this.apiService.getCurrentUserRole()
        );
      }),
      switchMap(() =>
        this.apiService.getTasks().pipe(
          tap((tasks) => {
            console.log('[EFFECT] API getTasks completed successfully');
            console.log('[EFFECT] Tasks received from API:', tasks);
          }),
          map((tasks) => {
            console.log('[EFFECT] Dispatching loadTasksSuccess action');
            return TaskActions.loadTasksSuccess({ tasks });
          }),
          catchError((error) => {
            console.error('[EFFECT] Error loading tasks:', error);
            return of(
              TaskActions.loadTasksFailure({
                error: error.message || 'Unknown error',
              })
            );
          })
        )
      )
    )
  );

  // Listen for role changes and reload tasks to update permissions
  roleChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.setUserRole),
      tap(({ role }) => {
        console.log('[EFFECT] Role change detected - new role:', role);
        console.log('[EFFECT] Reloading tasks to apply new permissions');
      }),
      map(() => TaskActions.loadTasks())
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.createTask),
      tap(({ task }) => {
        console.log('[EFFECT] createTask action received');
        console.log('[EFFECT] Task data to create:', task);
        console.log(
          '[EFFECT] Current organization:',
          this.apiService.getCurrentOrganization()
        );
        console.log(
          '[EFFECT] Current user role:',
          this.apiService.getCurrentUserRole()
        );
      }),
      switchMap(({ task }) =>
        this.apiService.createTask(task).pipe(
          tap((newTask) =>
            console.log('[EFFECT] Task created successfully:', newTask)
          ),
          mergeMap((newTask) => [
            TaskActions.createTaskSuccess({ task: newTask }),
            TaskActions.loadTasks(), // Reload tasks to ensure UI reflects the new task
          ]),
          catchError((error) => {
            console.error('[EFFECT] Error creating task:', error);
            return of(
              TaskActions.createTaskFailure({
                error: error.message || 'Unknown error',
              })
            );
          })
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.updateTask),
      tap(({ id, task }) => {
        console.log('[EFFECT] updateTask action received');
        console.log('[EFFECT] Task ID to update:', id);
        console.log('[EFFECT] Update data:', task);
        console.log(
          '[EFFECT] Current organization:',
          this.apiService.getCurrentOrganization()
        );
        console.log(
          '[EFFECT] Current user role:',
          this.apiService.getCurrentUserRole()
        );
      }),
      switchMap(({ id, task }) =>
        this.apiService.updateTask(id, task).pipe(
          tap((updatedTask) => {
            console.log('[EFFECT] API updateTask completed successfully');
            console.log(
              '[EFFECT] Updated task received from API:',
              updatedTask
            );
          }),
          mergeMap((updatedTask) => {
            console.log(
              '[EFFECT] Dispatching updateTaskSuccess and loadTasks actions'
            );
            return [
              TaskActions.updateTaskSuccess({ task: updatedTask }),
              TaskActions.loadTasks(), // Reload tasks to ensure UI reflects the updated task
            ];
          }),
          catchError((error) => {
            console.error(
              '[EFFECT] Error updating task in API service:',
              error
            );
            console.error('[EFFECT] Error details:', {
              message: error.message,
              stack: error.stack,
            });
            return of(
              TaskActions.updateTaskFailure({
                error: error.message || 'Unknown error',
              })
            );
          })
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.deleteTask),
      tap(({ id }) => console.log('[EFFECT] Deleting task:', id)),
      switchMap(({ id }) =>
        this.apiService.deleteTask(id).pipe(
          tap(() => console.log('[EFFECT] Task deleted successfully:', id)),
          mergeMap(() => [
            TaskActions.deleteTaskSuccess({ id }),
            TaskActions.loadTasks(), // Reload tasks to ensure UI reflects the deletion
          ]),
          catchError((error) => {
            console.error('[EFFECT] Error deleting task:', error);
            return of(
              TaskActions.deleteTaskFailure({
                error: error.message || 'Unknown error',
              })
            );
          })
        )
      )
    )
  );

  reorderTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.reorderTasks),
      switchMap(({ tasks }) => {
        console.log('[EFFECT] Reordering tasks:', tasks);
        // For now, we'll just return success without calling the API since the order field isn't fully implemented on the backend
        // In a real application, you might want to call an API endpoint to persist the new order
        return of(TaskActions.reorderTasksSuccess({ tasks })).pipe(
          catchError((error) =>
            of(
              TaskActions.reorderTasksFailure({
                error: error.message || 'Unknown error',
              })
            )
          )
        );
      })
    )
  );

  constructor() {
    console.log('[EFFECT] TaskEffects constructor called');
    console.log('[EFFECT] actions$ initialized:', !!this.actions$);
    console.log('[EFFECT] apiService initialized:', !!this.apiService);
  }
}
