import { taskReducer, initialState, TaskState } from './task.reducer';
import * as TaskActions from '../actions/task.actions';
import { Task } from '../../core/api.service';

describe('TaskReducer', () => {
  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO',
    category: 'Work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockTasks: Task[] = [
    mockTask,
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Test Description 2',
      status: 'IN_PROGRESS',
      category: 'Personal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  describe('Initial State', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' } as any;
      const state = taskReducer(undefined, action);

      expect(state).toEqual(initialState);
    });

    it('should have correct initial values', () => {
      expect(initialState.tasks).toEqual([]);
      expect(initialState.loading).toBe(false);
      expect(initialState.error).toBe(null);
    });
  });

  describe('Load Tasks Actions', () => {
    it('should set loading to true on loadTasks', () => {
      const action = TaskActions.loadTasks();
      const state = taskReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
      expect(state.tasks).toEqual([]);
    });

    it('should load tasks successfully', () => {
      const loadingState: TaskState = {
        tasks: [],
        loading: true,
        error: null,
      };

      const action = TaskActions.loadTasksSuccess({ tasks: mockTasks });
      const state = taskReducer(loadingState, action);

      expect(state.tasks).toEqual(mockTasks);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle load tasks failure', () => {
      const loadingState: TaskState = {
        tasks: [],
        loading: true,
        error: null,
      };

      const errorMessage = 'Failed to load tasks';
      const action = TaskActions.loadTasksFailure({ error: errorMessage });
      const state = taskReducer(loadingState, action);

      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      expect(state.tasks).toEqual([]);
    });

    it('should clear previous error on new load attempt', () => {
      const errorState: TaskState = {
        tasks: [],
        loading: false,
        error: 'Previous error',
      };

      const action = TaskActions.loadTasks();
      const state = taskReducer(errorState, action);

      expect(state.error).toBe(null);
      expect(state.loading).toBe(true);
    });
  });

  describe('Create Task Actions', () => {
    it('should add new task on createTaskSuccess', () => {
      const currentState: TaskState = {
        tasks: [mockTasks[0]],
        loading: false,
        error: null,
      };

      const newTask = mockTasks[1];
      const action = TaskActions.createTaskSuccess({ task: newTask });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toHaveLength(2);
      expect(state.tasks).toContain(newTask);
      expect(state.tasks[1]).toBe(newTask);
    });

    it('should handle create task failure', () => {
      const errorMessage = 'Failed to create task';
      const action = TaskActions.createTaskFailure({ error: errorMessage });
      const state = taskReducer(initialState, action);

      expect(state.error).toBe(errorMessage);
      expect(state.tasks).toEqual([]);
    });

    it('should preserve existing tasks when adding new one', () => {
      const currentState: TaskState = {
        tasks: [mockTasks[0]],
        loading: false,
        error: null,
      };

      const newTask = mockTasks[1];
      const action = TaskActions.createTaskSuccess({ task: newTask });
      const state = taskReducer(currentState, action);

      expect(state.tasks[0]).toBe(mockTasks[0]); // Original task preserved
      expect(state.tasks[1]).toBe(newTask); // New task added
    });
  });

  describe('Update Task Actions', () => {
    it('should update existing task on updateTaskSuccess', () => {
      const currentState: TaskState = {
        tasks: mockTasks,
        loading: false,
        error: null,
      };

      const updatedTask: Task = {
        ...mockTask,
        title: 'Updated Title',
        status: 'DONE',
      };

      const action = TaskActions.updateTaskSuccess({ task: updatedTask });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toHaveLength(2);
      expect(state.tasks[0]).toEqual(updatedTask);
      expect(state.tasks[1]).toBe(mockTasks[1]); // Other task unchanged
    });

    it('should handle update task failure', () => {
      const errorMessage = 'Failed to update task';
      const action = TaskActions.updateTaskFailure({ error: errorMessage });
      const state = taskReducer(initialState, action);

      expect(state.error).toBe(errorMessage);
    });

    it('should not modify tasks array if task ID not found', () => {
      const currentState: TaskState = {
        tasks: mockTasks,
        loading: false,
        error: null,
      };

      const nonExistentTask: Task = {
        ...mockTask,
        id: 999,
        title: 'Non-existent Task',
      };

      const action = TaskActions.updateTaskSuccess({ task: nonExistentTask });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toEqual(mockTasks); // No changes
    });
  });

  describe('Delete Task Actions', () => {
    it('should remove task on deleteTaskSuccess', () => {
      const currentState: TaskState = {
        tasks: mockTasks,
        loading: false,
        error: null,
      };

      const action = TaskActions.deleteTaskSuccess({ id: mockTask.id });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0]).toBe(mockTasks[1]);
      expect(state.tasks.find((t) => t.id === mockTask.id)).toBeUndefined();
    });

    it('should handle delete task failure', () => {
      const errorMessage = 'Failed to delete task';
      const action = TaskActions.deleteTaskFailure({ error: errorMessage });
      const state = taskReducer(initialState, action);

      expect(state.error).toBe(errorMessage);
    });

    it('should not modify tasks array if task ID not found', () => {
      const currentState: TaskState = {
        tasks: mockTasks,
        loading: false,
        error: null,
      };

      const action = TaskActions.deleteTaskSuccess({ id: 999 });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toEqual(mockTasks); // No changes
    });

    it('should handle deleting all tasks', () => {
      const currentState: TaskState = {
        tasks: [mockTask],
        loading: false,
        error: null,
      };

      const action = TaskActions.deleteTaskSuccess({ id: mockTask.id });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toEqual([]);
    });
  });

  describe('Reorder Tasks Actions', () => {
    it('should set loading to true on reorderTasks', () => {
      const action = TaskActions.reorderTasks({ tasks: mockTasks });
      const state = taskReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBe(null);
    });

    it('should update tasks order on reorderTasksSuccess', () => {
      const loadingState: TaskState = {
        tasks: mockTasks,
        loading: true,
        error: null,
      };

      const reorderedTasks = [mockTasks[1], mockTasks[0]]; // Reversed order
      const action = TaskActions.reorderTasksSuccess({ tasks: reorderedTasks });
      const state = taskReducer(loadingState, action);

      expect(state.tasks).toEqual(reorderedTasks);
      expect(state.loading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle reorder tasks failure', () => {
      const loadingState: TaskState = {
        tasks: mockTasks,
        loading: true,
        error: null,
      };

      const errorMessage = 'Failed to reorder tasks';
      const action = TaskActions.reorderTasksFailure({ error: errorMessage });
      const state = taskReducer(loadingState, action);

      expect(state.error).toBe(errorMessage);
      expect(state.loading).toBe(false);
      expect(state.tasks).toEqual(mockTasks); // Tasks remain unchanged
    });
  });

  describe('State Immutability', () => {
    it('should not mutate the original state', () => {
      const originalState: TaskState = {
        tasks: [mockTask],
        loading: false,
        error: null,
      };

      const action = TaskActions.createTaskSuccess({ task: mockTasks[1] });
      const newState = taskReducer(originalState, action);

      expect(originalState.tasks).toHaveLength(1); // Original unchanged
      expect(newState.tasks).toHaveLength(2); // New state updated
      expect(newState).not.toBe(originalState); // Different object references
    });

    it('should not mutate tasks array', () => {
      const originalTasks = [mockTask];
      const currentState: TaskState = {
        tasks: originalTasks,
        loading: false,
        error: null,
      };

      const action = TaskActions.createTaskSuccess({ task: mockTasks[1] });
      const newState = taskReducer(currentState, action);

      expect(originalTasks).toHaveLength(1); // Original array unchanged
      expect(newState.tasks).toHaveLength(2); // New array created
      expect(newState.tasks).not.toBe(originalTasks); // Different array references
    });
  });

  describe('Error State Management', () => {
    it('should clear error on successful operations', () => {
      const errorState: TaskState = {
        tasks: [],
        loading: false,
        error: 'Previous error',
      };

      const action = TaskActions.loadTasksSuccess({ tasks: mockTasks });
      const state = taskReducer(errorState, action);

      expect(state.error).toBe(null);
    });

    it('should preserve tasks when error occurs', () => {
      const currentState: TaskState = {
        tasks: mockTasks,
        loading: false,
        error: null,
      };

      const action = TaskActions.createTaskFailure({ error: 'Create failed' });
      const state = taskReducer(currentState, action);

      expect(state.tasks).toEqual(mockTasks); // Tasks preserved
      expect(state.error).toBe('Create failed');
    });
  });

  describe('Unknown Actions', () => {
    it('should return current state for unknown actions', () => {
      const currentState: TaskState = {
        tasks: mockTasks,
        loading: false,
        error: null,
      };

      const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
      const state = taskReducer(currentState, unknownAction);

      expect(state).toBe(currentState); // Should return exact same reference
    });
  });
});
