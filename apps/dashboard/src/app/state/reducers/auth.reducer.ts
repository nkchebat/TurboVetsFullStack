import { createReducer, on } from '@ngrx/store';
import { UserRole } from '../../core/auth.service';
import * as AuthActions from '../actions/auth.actions';

export interface AuthState {
  userRole: UserRole;
  isLoggedIn: boolean;
}

export const initialState: AuthState = {
  userRole: 'Admin',
  isLoggedIn: true, // For demo purposes
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.initializeAuth, (state) => {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    return {
      ...state,
      userRole: savedRole || state.userRole,
    };
  }),
  on(AuthActions.setUserRole, (state, { role }) => {
    localStorage.setItem('userRole', role);
    return {
      ...state,
      userRole: role,
    };
  }),
  on(AuthActions.clearUserRole, () => initialState)
);
