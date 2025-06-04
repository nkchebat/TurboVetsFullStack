import { createReducer, on } from '@ngrx/store';
import { Task } from '../../core/api.service';
import * as TaskActions from '../actions/task.actions';

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

export const taskReducer = createReducer(
  initialState,

  // Load Tasks
  on(TaskActions.loadTasks, (state) => {
    console.log('[REDUCER] loadTasks action received - Setting loading state');
    return {
      ...state,
      loading: true,
      error: null,
    };
  }),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) => {
    console.log('[REDUCER] loadTasksSuccess action received');
    console.log('[REDUCER] Previous state tasks:', state.tasks);
    console.log('[REDUCER] Setting new tasks in state:', tasks);
    return {
      ...state,
      tasks,
      loading: false,
      error: null,
    };
  }),
  on(TaskActions.loadTasksFailure, (state, { error }) => {
    console.log('[REDUCER] loadTasksFailure action received');
    console.error('[REDUCER] Error:', error);
    return {
      ...state,
      error,
      loading: false,
    };
  }),

  // Create Task
  on(TaskActions.createTaskSuccess, (state, { task }) => {
    console.log('createTaskSuccess action received with task:', task);
    return {
      ...state,
      tasks: [...state.tasks, task],
      error: null,
    };
  }),
  on(TaskActions.createTaskFailure, (state, { error }) => {
    console.log('createTaskFailure action received with error:', error);
    return {
      ...state,
      error,
    };
  }),

  // Update Task
  on(TaskActions.updateTaskSuccess, (state, { task }) => {
    console.log('updateTaskSuccess action received with task:', task);
    return {
      ...state,
      tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
      error: null,
    };
  }),
  on(TaskActions.updateTaskFailure, (state, { error }) => {
    console.log('updateTaskFailure action received with error:', error);
    return {
      ...state,
      error,
    };
  }),

  // Delete Task
  on(TaskActions.deleteTaskSuccess, (state, { id }) => {
    console.log('deleteTaskSuccess action received with id:', id);
    return {
      ...state,
      tasks: state.tasks.filter((task) => task.id !== id),
      error: null,
    };
  }),
  on(TaskActions.deleteTaskFailure, (state, { error }) => {
    console.log('deleteTaskFailure action received with error:', error);
    return {
      ...state,
      error,
    };
  }),

  // Reorder Tasks
  on(TaskActions.reorderTasks, (state) => {
    console.log('reorderTasks action received - Setting loading state');
    return {
      ...state,
      loading: true,
      error: null,
    };
  }),
  on(TaskActions.reorderTasksSuccess, (state, { tasks }) => {
    console.log('reorderTasksSuccess action received with tasks:', tasks);
    return {
      ...state,
      tasks,
      loading: false,
      error: null,
    };
  }),
  on(TaskActions.reorderTasksFailure, (state, { error }) => {
    console.log('reorderTasksFailure action received with error:', error);
    return {
      ...state,
      error,
      loading: false,
    };
  })
);
