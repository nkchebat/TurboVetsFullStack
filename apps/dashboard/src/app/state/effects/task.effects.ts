import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { ApiService } from '../../core/api.service';
import * as TaskActions from '../actions/task.actions';

@Injectable()
export class TaskEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly apiService: ApiService
  ) {}

  loadTasks$ = createEffect(() => {
    return of(this.actions$).pipe(
      mergeMap(() => this.actions$),
      ofType(TaskActions.loadTasks),
      mergeMap(() =>
        this.apiService.getTasks().pipe(
          map((tasks) => TaskActions.loadTasksSuccess({ tasks })),
          catchError((error) =>
            of(TaskActions.loadTasksFailure({ error: error.message }))
          )
        )
      )
    );
  });

  createTask$ = createEffect(() => {
    return of(this.actions$).pipe(
      mergeMap(() => this.actions$),
      ofType(TaskActions.createTask),
      mergeMap(({ task }) =>
        this.apiService.createTask(task).pipe(
          map((newTask) => TaskActions.createTaskSuccess({ task: newTask })),
          catchError((error) =>
            of(TaskActions.createTaskFailure({ error: error.message }))
          )
        )
      )
    );
  });

  updateTask$ = createEffect(() => {
    return of(this.actions$).pipe(
      mergeMap(() => this.actions$),
      ofType(TaskActions.updateTask),
      mergeMap(({ id, task }) =>
        this.apiService.updateTask(id, task).pipe(
          map((updatedTask) =>
            TaskActions.updateTaskSuccess({ task: updatedTask })
          ),
          catchError((error) =>
            of(TaskActions.updateTaskFailure({ error: error.message }))
          )
        )
      )
    );
  });

  deleteTask$ = createEffect(() => {
    return of(this.actions$).pipe(
      mergeMap(() => this.actions$),
      ofType(TaskActions.deleteTask),
      mergeMap(({ id }) =>
        this.apiService.deleteTask(id).pipe(
          map(() => TaskActions.deleteTaskSuccess({ id })),
          catchError((error) =>
            of(TaskActions.deleteTaskFailure({ error: error.message }))
          )
        )
      )
    );
  });
}
