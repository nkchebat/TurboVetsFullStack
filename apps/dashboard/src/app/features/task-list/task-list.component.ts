import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Task, TaskCategory } from '../../core/api.service';
import * as TaskActions from '../../state/actions/task.actions';
import {
  selectAllTasks,
  selectLoading,
  selectIsOwnerOrAdmin,
} from '../../state/selectors';
import { moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-list',
  template: `
    <div class="p-4">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
      >
        <h1 class="text-2xl font-bold dark:text-white">Tasks</h1>
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search and Filters -->
          <div class="flex gap-2">
            <input
              type="text"
              [formControl]="searchControl"
              placeholder="Search tasks..."
              class="form-input w-48 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <select
              [formControl]="categoryFilter"
              class="form-input w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">All Categories</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Shopping">Shopping</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
            <select
              [formControl]="statusFilter"
              class="form-input w-32 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">All Status</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
          <button
            *ngIf="isOwnerOrAdmin$ | async"
            class="btn btn-primary"
            (click)="onCreateTask()"
          >
            Create Task
          </button>
        </div>
      </div>

      <!-- Task Completion Progress -->
      <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          Task Progress
        </h3>
        <div
          class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-green-500 transition-all duration-500"
            [style.width.%]="completionPercentage$ | async"
          ></div>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ completedTasks$ | async }} of {{ totalTasks$ | async }} tasks
          completed
        </div>
      </div>

      <div *ngIf="loading$ | async" class="flex justify-center">
        <div
          class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
        ></div>
      </div>

      <div
        *ngIf="!(loading$ | async)"
        cdkDropList
        (cdkDropListDropped)="onDrop($event)"
        class="grid gap-4"
      >
        <div
          *ngFor="let task of filteredTasks$ | async"
          cdkDrag
          class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow cursor-move"
          [class.border-l-4]="true"
          [class.border-yellow-500]="task.status === 'TODO'"
          [class.border-blue-500]="task.status === 'IN_PROGRESS'"
          [class.border-green-500]="task.status === 'DONE'"
        >
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-semibold dark:text-white">
                  {{ task.title }}
                </h3>
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  [class.bg-purple-100]="task.category === 'Work'"
                  [class.bg-orange-100]="task.category === 'Personal'"
                  [class.bg-blue-100]="task.category === 'Shopping'"
                  [class.bg-green-100]="task.category === 'Health'"
                  [class.bg-gray-100]="task.category === 'Other'"
                >
                  {{ task.category }}
                </span>
              </div>
              <p class="text-gray-600 dark:text-gray-300 mt-1">
                {{ task.description }}
              </p>
              <span
                class="inline-block mt-2 px-2 py-1 text-sm rounded-full"
                [class.bg-yellow-100]="task.status === 'TODO'"
                [class.bg-blue-100]="task.status === 'IN_PROGRESS'"
                [class.bg-green-100]="task.status === 'DONE'"
              >
                {{ task.status }}
              </span>
            </div>

            <div *ngIf="isOwnerOrAdmin$ | async" class="flex gap-2">
              <button
                class="btn btn-primary text-sm"
                (click)="onEditTask(task.id)"
              >
                Edit
              </button>
              <button
                class="btn btn-danger text-sm"
                (click)="onDeleteTask(task.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks$: Observable<Task[]>;
  loading$: Observable<boolean>;
  isOwnerOrAdmin$: Observable<boolean>;
  filteredTasks$: Observable<Task[]>;
  completionPercentage$: Observable<number>;
  completedTasks$: Observable<number>;
  totalTasks$: Observable<number>;
  private subscriptions: Subscription = new Subscription();

  searchControl = new FormControl('');
  categoryFilter = new FormControl<TaskCategory | ''>('');
  statusFilter = new FormControl<'TODO' | 'IN_PROGRESS' | 'DONE' | ''>('');

  constructor(private store: Store, private router: Router) {
    this.tasks$ = this.store.select(selectAllTasks);
    this.loading$ = this.store.select(selectLoading);
    this.isOwnerOrAdmin$ = this.store.select(selectIsOwnerOrAdmin);

    // Set up filtered tasks
    this.filteredTasks$ = combineLatest([
      this.tasks$,
      this.searchControl.valueChanges.pipe(startWith('')),
      this.categoryFilter.valueChanges.pipe(startWith('')),
      this.statusFilter.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([tasks, search, category, status]) => {
        return tasks.filter((task) => {
          const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search.toLowerCase()) ||
            (task.description?.toLowerCase() || '').includes(
              search.toLowerCase()
            );
          const matchesCategory = !category || task.category === category;
          const matchesStatus = !status || task.status === status;
          return matchesSearch && matchesCategory && matchesStatus;
        });
      })
    );

    // Set up task completion metrics
    this.totalTasks$ = this.tasks$.pipe(map((tasks) => tasks.length));

    this.completedTasks$ = this.tasks$.pipe(
      map((tasks) => tasks.filter((t) => t.status === 'DONE').length)
    );

    this.completionPercentage$ = combineLatest([
      this.completedTasks$,
      this.totalTasks$,
    ]).pipe(
      map(([completed, total]) => (total > 0 ? (completed / total) * 100 : 0))
    );
  }

  ngOnInit(): void {
    console.log('TaskListComponent initialized');
    this.store.dispatch(TaskActions.loadTasks());
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onCreateTask(): void {
    console.log('Navigating to create task form');
    this.router.navigate(['/tasks/new']);
  }

  onEditTask(id: number): void {
    console.log('Navigating to edit task:', id);
    this.router.navigate([`/tasks/${id}/edit`]);
  }

  onDeleteTask(id: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      console.log('Deleting task:', id);
      this.store.dispatch(TaskActions.deleteTask({ id }));
    }
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const subscription = this.filteredTasks$.subscribe((tasks) => {
      const taskArray = [...tasks];
      moveItemInArray(taskArray, event.previousIndex, event.currentIndex);

      // Update the order of tasks
      taskArray.forEach((task, index) => {
        this.store.dispatch(
          TaskActions.updateTask({
            id: task.id,
            task: { order: index },
          })
        );
      });
    });
    this.subscriptions.add(subscription);
  }
}
