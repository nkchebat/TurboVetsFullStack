import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Task } from '../../core/api.service';
import * as TaskActions from '../../state/actions/task.actions';
import { selectAllTasks } from '../../state/selectors';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-form',
  template: `
    <div class="p-4 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">
        {{ isEditMode ? 'Edit' : 'Create' }} Task
      </h1>

      <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="form-label" for="title">Title</label>
          <input
            id="title"
            type="text"
            formControlName="title"
            class="form-input"
            [class.border-red-500]="
              taskForm.get('title')?.invalid && taskForm.get('title')?.touched
            "
          />
          <div
            *ngIf="
              taskForm.get('title')?.invalid && taskForm.get('title')?.touched
            "
            class="text-red-500 text-sm mt-1"
          >
            Title is required
          </div>
        </div>

        <div>
          <label class="form-label" for="description">Description</label>
          <textarea
            id="description"
            formControlName="description"
            class="form-input"
            rows="3"
          ></textarea>
        </div>

        <div>
          <label class="form-label" for="status">Status</label>
          <select id="status" formControlName="status" class="form-input">
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div class="flex gap-4 pt-4">
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="taskForm.invalid"
          >
            {{ isEditMode ? 'Update' : 'Create' }}
          </button>
          <button
            type="button"
            class="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
            (click)="onCancel()"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class TaskFormComponent implements OnInit {
  taskForm: FormGroup;
  isEditMode = false;
  taskId?: number;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      status: ['TODO'],
      category: ['Work'],
    });
  }

  ngOnInit(): void {
    this.taskId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !isNaN(this.taskId);

    if (this.isEditMode && this.taskId) {
      this.store.select(selectAllTasks).subscribe((tasks) => {
        const task = tasks.find((t: Task) => t.id === this.taskId);
        if (task) {
          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            status: task.status,
            category: task.category,
          });
        }
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const taskData = this.taskForm.value;
      console.log('Submitting task:', taskData);

      if (this.isEditMode && this.taskId) {
        this.store.dispatch(
          TaskActions.updateTask({
            id: this.taskId,
            task: taskData,
          })
        );
      } else {
        this.store.dispatch(
          TaskActions.createTask({
            task: taskData,
          })
        );
      }

      this.router.navigate(['/tasks']);
    }
  }

  onCancel(): void {
    this.router.navigate(['/tasks']);
  }
}
