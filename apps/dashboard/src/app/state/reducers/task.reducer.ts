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
  on(TaskActions.loadTasks, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
  })),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),

  // Create Task
  on(TaskActions.createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
  })),
  on(TaskActions.createTaskFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // Update Task
  on(TaskActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
  })),
  on(TaskActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // Delete Task
  on(TaskActions.deleteTaskSuccess, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter((task) => task.id !== id),
  })),
  on(TaskActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
