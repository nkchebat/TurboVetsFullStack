import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of, BehaviorSubject } from 'rxjs';
import { TaskListComponent } from './task-list.component';
import { KeyboardShortcutsService } from '../../core/keyboard-shortcuts.service';
import { Task, TaskCategory } from '../../core/api.service';
import * as TaskActions from '../../state/actions/task.actions';
import {
  selectAllTasks,
  selectLoading,
  selectError,
  selectIsOwnerOrAdmin,
} from '../../state/selectors';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let mockStore: MockStore;
  let mockRouter: jest.Mocked<Router>;
  let mockKeyboardService: jest.Mocked<KeyboardShortcutsService>;

  const mockTasks: Task[] = [
    {
      id: 1,
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'TODO',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Test Task 2',
      description: 'Description 2',
      status: 'IN_PROGRESS',
      category: 'Personal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Test Task 3',
      description: 'Description 3',
      status: 'DONE',
      category: 'Work',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialState = {
    tasks: {
      tasks: mockTasks,
      loading: false,
      error: null,
    },
    auth: {
      userRole: 'Admin',
      isLoggedIn: true,
    },
  };

  beforeEach(async () => {
    const routerSpy = {
      navigate: jest.fn(),
    };
    const keyboardSpy = {
      shortcut$: of('test-action'),
    };

    await TestBed.configureTestingModule({
      imports: [TaskListComponent, ReactiveFormsModule, DragDropModule],
      providers: [
        provideMockStore({ initialState }),
        { provide: Router, useValue: routerSpy },
        { provide: KeyboardShortcutsService, useValue: keyboardSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    mockStore = TestBed.inject(Store) as MockStore;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;
    mockKeyboardService = TestBed.inject(
      KeyboardShortcutsService
    ) as jest.Mocked<KeyboardShortcutsService>;

    // Override selectors to return appropriate observables
    mockStore.overrideSelector(selectAllTasks, mockTasks);
    mockStore.overrideSelector(selectLoading, false);
    mockStore.overrideSelector(selectError, null);
    mockStore.overrideSelector(selectIsOwnerOrAdmin, true);

    // Add spy on store dispatch
    jest.spyOn(mockStore, 'dispatch');
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize observables on ngOnInit', () => {
      component.ngOnInit();

      expect(component.tasks$).toBeDefined();
      expect(component.loading$).toBeDefined();
      expect(component.error$).toBeDefined();
      expect(component.isOwnerOrAdmin$).toBeDefined();
    });

    it('should dispatch loadTasks action on init', async () => {
      component.ngOnInit();

      // Wait for the setTimeout in ngOnInit to execute
      await new Promise((resolve) => setTimeout(resolve, 1));

      expect(mockStore.dispatch).toHaveBeenCalledWith(TaskActions.loadTasks());
    });

    it('should unsubscribe on destroy', () => {
      const unsubscribeSpy = jest.spyOn(
        component['subscriptions'],
        'unsubscribe'
      );

      component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('RBAC - Role-Based Access Control', () => {
    it('should show create button for Owner/Admin users', () => {
      mockStore.overrideSelector(selectIsOwnerOrAdmin, true);
      mockStore.refreshState();

      component.ngOnInit();
      fixture.detectChanges();

      const createButtons = fixture.nativeElement.querySelectorAll('button');
      const createButton = Array.from(createButtons).find((btn: any) =>
        btn.textContent.trim().includes('Create Task')
      );
      expect(createButton).toBeTruthy();
    });

    it('should hide create button for Viewer users', () => {
      mockStore.overrideSelector(selectIsOwnerOrAdmin, false);
      mockStore.refreshState();

      component.ngOnInit();
      fixture.detectChanges();

      const createButtons = fixture.nativeElement.querySelectorAll('button');
      const createButton = Array.from(createButtons).find((btn: any) =>
        btn.textContent.trim().includes('Create Task')
      );
      expect(createButton).toBeFalsy();
    });

    it('should show quick delete toggle for Owner/Admin users', () => {
      mockStore.overrideSelector(selectIsOwnerOrAdmin, true);
      mockStore.refreshState();

      component.ngOnInit();
      fixture.detectChanges();

      const quickDeleteToggle = fixture.nativeElement.querySelector(
        'input[type="checkbox"]'
      );
      expect(quickDeleteToggle).toBeTruthy();
    });

    it('should hide quick delete toggle for Viewer users', () => {
      mockStore.overrideSelector(selectIsOwnerOrAdmin, false);
      mockStore.refreshState();

      component.ngOnInit();
      fixture.detectChanges();

      const quickDeleteToggle = fixture.nativeElement.querySelector(
        'input[type="checkbox"]'
      );
      expect(quickDeleteToggle).toBeFalsy();
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should filter tasks by search term', () => {
      component.searchControl.setValue('Test Task 1');

      component.filteredTasks$.subscribe((tasks) => {
        expect(tasks.length).toBe(1);
        expect(tasks[0].title).toBe('Test Task 1');
      });
    });

    it('should filter tasks by category', () => {
      component.categoryFilter.setValue('Work');

      component.filteredTasks$.subscribe((tasks) => {
        expect(tasks.length).toBe(2);
        expect(tasks.every((task) => task.category === 'Work')).toBe(true);
      });
    });

    it('should filter tasks by status', () => {
      component.statusFilter.setValue('DONE');

      component.filteredTasks$.subscribe((tasks) => {
        expect(tasks.length).toBe(1);
        expect(tasks[0].status).toBe('DONE');
      });
    });

    it('should combine multiple filters', () => {
      component.searchControl.setValue('Test');
      component.categoryFilter.setValue('Work');
      component.statusFilter.setValue('TODO');

      component.filteredTasks$.subscribe((tasks) => {
        expect(tasks.length).toBe(1);
        expect(tasks[0].title).toBe('Test Task 1');
        expect(tasks[0].category).toBe('Work');
        expect(tasks[0].status).toBe('TODO');
      });
    });
  });

  describe('Task Operations', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should open create task dialog', () => {
      component.onCreateTask();

      expect(component.showCreateTaskDialog).toBe(true);
    });

    it('should open edit task dialog with selected task', () => {
      const task = mockTasks[0];

      component.onEditTask(task);

      expect(component.showEditTaskDialog).toBe(true);
      expect(component.taskToEdit).toBe(task);
    });

    it('should open delete confirmation dialog', () => {
      const task = mockTasks[0];

      component.onDeleteTask(task);

      expect(component.showDeleteDialog).toBe(true);
      expect(component.taskToDelete).toBe(task);
    });

    it('should dispatch createTask action on confirm create', () => {
      const taskData = {
        title: 'New Task',
        description: 'New Description',
        category: 'Work' as TaskCategory,
        status: 'TODO' as const,
      };

      component.onConfirmCreateTask(taskData);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        TaskActions.createTask({ task: taskData })
      );
      expect(component.showCreateTaskDialog).toBe(false);
    });

    it('should dispatch updateTask action on confirm edit', () => {
      const editData = {
        id: 1,
        task: {
          title: 'Updated Task',
          description: 'Updated Description',
          category: 'Personal' as TaskCategory,
          status: 'IN_PROGRESS' as const,
        },
      };

      component.onConfirmEditTask(editData);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        TaskActions.updateTask(editData)
      );
      expect(component.showEditTaskDialog).toBe(false);
    });

    it('should dispatch deleteTask action on confirm delete', () => {
      component.taskToDelete = mockTasks[0];

      component.onConfirmDelete();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        TaskActions.deleteTask({ id: mockTasks[0].id })
      );
      expect(component.showDeleteDialog).toBe(false);
      expect(component.taskToDelete).toBe(null);
    });
  });

  describe('Quick Delete Functionality', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show warning dialog when enabling quick delete for first time', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      component.quickDeleteEnabled = false;
      const event = new Event('click');
      jest.spyOn(event, 'preventDefault');

      component.onQuickDeleteToggle(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.showQuickDeleteWarning).toBe(true);
      expect(component.quickDeleteEnabled).toBe(false);
    });

    it('should enable quick delete without warning if previously acknowledged', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValue('true');
      component.quickDeleteEnabled = true;
      const event = new Event('click');
      jest.spyOn(event, 'preventDefault');

      component.onQuickDeleteToggle(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(component.quickDeleteEnabled).toBe(false);
      expect(component.showQuickDeleteWarning).toBe(false);
    });

    it('should save preference when confirming quick delete warning', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

      component.onConfirmQuickDeleteWarning();

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'quickDeleteEnabled',
        'true'
      );
      expect(component.quickDeleteEnabled).toBe(true);
      expect(component.showQuickDeleteWarning).toBe(false);
    });
  });

  describe('Progress Calculation', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should calculate completion percentage correctly', () => {
      component.completionPercentage$.subscribe((percentage) => {
        // 1 out of 3 tasks is DONE = 33.33%
        expect(percentage).toBeCloseTo(33.33, 1);
      });
    });

    it('should count completed tasks correctly', () => {
      component.completedTasks$.subscribe((count) => {
        expect(count).toBe(1); // Only one task with status 'DONE'
      });
    });

    it('should count total tasks correctly', () => {
      component.totalTasks$.subscribe((count) => {
        expect(count).toBe(3);
      });
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      // Mock scrollIntoView for JSDOM compatibility
      Element.prototype.scrollIntoView = jest.fn();

      // Mock querySelectorAll to return mock elements with scrollIntoView
      const mockElement = {
        scrollIntoView: jest.fn(),
      };
      jest
        .spyOn(document, 'querySelectorAll')
        .mockReturnValue([mockElement, mockElement, mockElement] as any);

      component.ngOnInit();
      fixture.detectChanges();
    });

    afterEach(() => {
      // Restore original implementations
      jest.restoreAllMocks();
    });

    it('should navigate up through tasks', () => {
      component.selectedTaskIndex = 1;
      component.filteredTasksArray = mockTasks;

      component['navigateUp']();

      expect(component.selectedTaskIndex).toBe(0);
    });

    it('should navigate down through tasks', () => {
      component.selectedTaskIndex = 0;
      component.filteredTasksArray = mockTasks;

      component['navigateDown']();

      expect(component.selectedTaskIndex).toBe(1);
    });

    it('should wrap around when navigating past bounds', () => {
      component.selectedTaskIndex = 0;
      component.filteredTasksArray = mockTasks;

      component['navigateUp']();

      expect(component.selectedTaskIndex).toBe(2); // Wraps to last item
    });

    it('should edit selected task on keyboard shortcut', () => {
      component.selectedTaskIndex = 0;
      component.filteredTasksArray = mockTasks;

      component['editSelectedTask']();

      expect(component.showEditTaskDialog).toBe(true);
      expect(component.taskToEdit).toBe(mockTasks[0]);
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error state is present', () => {
      mockStore.overrideSelector(selectError, 'Failed to load tasks');
      mockStore.refreshState();

      component.ngOnInit();
      fixture.detectChanges();

      const errorElement = fixture.nativeElement.querySelector('.bg-red-100');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Failed to load tasks');
    });

    it('should show loading spinner when loading', () => {
      mockStore.overrideSelector(selectLoading, true);
      mockStore.refreshState();

      component.ngOnInit();
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });
  });
});
