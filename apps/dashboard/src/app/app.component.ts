import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectIsOwnerOrAdmin, selectUserRole } from './state/selectors';
import { UserRole } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as AuthActions from './state/actions/auth.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class AppComponent implements OnInit {
  isOwnerOrAdmin$: Observable<boolean>;
  userRole$: Observable<UserRole>;

  constructor(private store: Store, public themeService: ThemeService) {
    this.isOwnerOrAdmin$ = this.store.select(selectIsOwnerOrAdmin);
    this.userRole$ = this.store.select(selectUserRole);
  }

  ngOnInit() {
    console.log('AppComponent initialized');
    this.store.dispatch(AuthActions.initializeAuth());
  }

  onRoleChange(role: UserRole): void {
    this.store.dispatch(AuthActions.setUserRole({ role }));
  }
}
