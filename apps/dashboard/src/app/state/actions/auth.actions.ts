import { createAction, props } from '@ngrx/store';
import { UserRole } from '../../core/auth.service';

export const initializeAuth = createAction('[Auth] Initialize');

export const setUserRole = createAction(
  '[Auth] Set User Role',
  props<{ role: UserRole }>()
);

export const clearUserRole = createAction('[Auth] Clear User Role');
