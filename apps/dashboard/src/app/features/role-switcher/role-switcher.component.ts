import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { UserRole } from '../../core/auth.service';
import * as AuthActions from '../../state/actions/auth.actions';
import { selectUserRole } from '../../state/selectors';

@Component({
  selector: 'app-role-switcher',
  template: `
    <div class="p-4">
      <label class="form-label" for="role">Select Role:</label>
      <select
        id="role"
        [ngModel]="(userRole$ | async) || 'Viewer'"
        (ngModelChange)="onRoleChange($event)"
        class="form-input"
      >
        <option value="Owner">Owner</option>
        <option value="Admin">Admin</option>
        <option value="Viewer">Viewer</option>
      </select>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class RoleSwitcherComponent implements OnInit {
  userRole$: Observable<UserRole>;

  constructor(private store: Store) {
    this.userRole$ = this.store.select(selectUserRole);
  }

  ngOnInit(): void {}

  onRoleChange(role: UserRole): void {
    this.store.dispatch(AuthActions.setUserRole({ role }));
  }
}
