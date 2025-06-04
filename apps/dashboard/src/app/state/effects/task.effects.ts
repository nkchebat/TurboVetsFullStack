import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import * as TaskActions from '../actions/task.actions';

@Injectable()
export class TaskEffects {
  // ✅ Using inject() - these are resolved at the right time
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  // ✅ Now this.actions$ and this.apiService are available
  loadTasks$ = createEffect(() => {
    console.log('[EFFECT] Creating loadTasks$ effect');
    return this.actions$.pipe(
      tap((action) => console.log('[EFFECT] Received action:', action)),
      ofType(TaskActions.loadTasks),
      tap(() => console.log('[EFFECT] loadTasks action matched')),
      switchMap(() => {
        console.log('[EFFECT] Starting API call');
        return this.apiService.getTasks().pipe(
          tap((tasks) => console.log('[EFFECT] API returned tasks:', tasks)),
          map((tasks) => {
            console.log('[EFFECT] Mapping to loadTasksSuccess action');
            return TaskActions.loadTasksSuccess({ tasks });
          }),
          catchError((error) => {
            console.error('[EFFECT] Error in getTasks:', error);
            return of(
              TaskActions.loadTasksFailure({
                error: error.message || 'Unknown error',
              })
            );
          })
        );
      })
    );
  });

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.createTask),
      switchMap(({ task }) =>
        this.apiService.createTask(task).pipe(
          map((newTask) => TaskActions.createTaskSuccess({ task: newTask })),
          catchError((error) =>
            of(
              TaskActions.createTaskFailure({
                error: error.message || 'Unknown error',
              })
            )
          )
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.updateTask),
      switchMap(({ id, task }) =>
        this.apiService.updateTask(id, task).pipe(
          map((updatedTask) =>
            TaskActions.updateTaskSuccess({ task: updatedTask })
          ),
          catchError((error) =>
            of(
              TaskActions.updateTaskFailure({
                error: error.message || 'Unknown error',
              })
            )
          )
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.deleteTask),
      switchMap(({ id }) =>
        this.apiService.deleteTask(id).pipe(
          map(() => TaskActions.deleteTaskSuccess({ id })),
          catchError((error) =>
            of(
              TaskActions.deleteTaskFailure({
                error: error.message || 'Unknown error',
              })
            )
          )
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
