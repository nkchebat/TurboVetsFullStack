import { authReducer, initialState, AuthState } from './auth.reducer';
import * as AuthActions from '../actions/auth.actions';
import { UserRole } from '../../core/auth.service';

describe('AuthReducer', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should return the initial state', () => {
      const action = { type: 'Unknown' } as any;
      const state = authReducer(undefined, action);

      expect(state).toEqual(initialState);
    });

    it('should have correct initial values', () => {
      expect(initialState.userRole).toBe('Admin');
      expect(initialState.isLoggedIn).toBe(true);
    });
  });

  describe('initializeAuth Action', () => {
    it('should initialize with saved role from localStorage', () => {
      localStorage.setItem('userRole', 'Owner');
      const action = AuthActions.initializeAuth();
      const state = authReducer(initialState, action);

      expect(state.userRole).toBe('Owner');
      expect(state.isLoggedIn).toBe(true);
    });

    it('should use default role when no saved role exists', () => {
      const action = AuthActions.initializeAuth();
      const state = authReducer(initialState, action);

      expect(state.userRole).toBe('Admin'); // Default from initial state
      expect(state.isLoggedIn).toBe(true);
    });

    it('should use saved role even if invalid (reducer does not validate)', () => {
      localStorage.setItem('userRole', 'InvalidRole');
      const action = AuthActions.initializeAuth();
      const state = authReducer(initialState, action);

      expect(state.userRole).toBe('InvalidRole'); // Reducer doesn't validate
    });
  });

  describe('setUserRole Action', () => {
    it('should update user role to Owner', () => {
      const action = AuthActions.setUserRole({ role: 'Owner' });
      const state = authReducer(initialState, action);

      expect(state.userRole).toBe('Owner');
      expect(localStorage.getItem('userRole')).toBe('Owner');
    });

    it('should update user role to Viewer', () => {
      const action = AuthActions.setUserRole({ role: 'Viewer' });
      const state = authReducer(initialState, action);

      expect(state.userRole).toBe('Viewer');
      expect(localStorage.getItem('userRole')).toBe('Viewer');
    });

    it('should update user role to Admin', () => {
      const action = AuthActions.setUserRole({ role: 'Admin' });
      const state = authReducer(initialState, action);

      expect(state.userRole).toBe('Admin');
      expect(localStorage.getItem('userRole')).toBe('Admin');
    });

    it('should preserve other state properties when updating role', () => {
      const currentState: AuthState = {
        userRole: 'Viewer',
        isLoggedIn: true,
      };

      const action = AuthActions.setUserRole({ role: 'Owner' });
      const state = authReducer(currentState, action);

      expect(state.userRole).toBe('Owner');
      expect(state.isLoggedIn).toBe(true); // Should remain unchanged
    });

    it('should overwrite existing localStorage value', () => {
      localStorage.setItem('userRole', 'Viewer');

      const action = AuthActions.setUserRole({ role: 'Owner' });
      authReducer(initialState, action);

      expect(localStorage.getItem('userRole')).toBe('Owner');
    });
  });

  describe('clearUserRole Action', () => {
    it('should reset state to initial values', () => {
      const currentState: AuthState = {
        userRole: 'Owner',
        isLoggedIn: true,
      };

      const action = AuthActions.clearUserRole();
      const state = authReducer(currentState, action);

      expect(state).toEqual(initialState);
    });

    it('should reset from any role to initial state', () => {
      const viewerState: AuthState = {
        userRole: 'Viewer',
        isLoggedIn: true,
      };

      const action = AuthActions.clearUserRole();
      const state = authReducer(viewerState, action);

      expect(state.userRole).toBe('Admin');
      expect(state.isLoggedIn).toBe(true);
    });
  });

  describe('Role Transitions', () => {
    it('should handle Owner to Admin transition', () => {
      const ownerState: AuthState = {
        userRole: 'Owner',
        isLoggedIn: true,
      };

      const action = AuthActions.setUserRole({ role: 'Admin' });
      const state = authReducer(ownerState, action);

      expect(state.userRole).toBe('Admin');
    });

    it('should handle Admin to Viewer transition', () => {
      const adminState: AuthState = {
        userRole: 'Admin',
        isLoggedIn: true,
      };

      const action = AuthActions.setUserRole({ role: 'Viewer' });
      const state = authReducer(adminState, action);

      expect(state.userRole).toBe('Viewer');
    });

    it('should handle Viewer to Owner transition', () => {
      const viewerState: AuthState = {
        userRole: 'Viewer',
        isLoggedIn: true,
      };

      const action = AuthActions.setUserRole({ role: 'Owner' });
      const state = authReducer(viewerState, action);

      expect(state.userRole).toBe('Owner');
    });
  });

  describe('State Immutability', () => {
    it('should not mutate the original state', () => {
      const originalState: AuthState = {
        userRole: 'Admin',
        isLoggedIn: true,
      };

      const action = AuthActions.setUserRole({ role: 'Owner' });
      const newState = authReducer(originalState, action);

      expect(originalState.userRole).toBe('Admin'); // Original unchanged
      expect(newState.userRole).toBe('Owner'); // New state updated
      expect(newState).not.toBe(originalState); // Different object references
    });

    it('should create new state object for each action', () => {
      const state1 = authReducer(
        initialState,
        AuthActions.setUserRole({ role: 'Owner' })
      );
      const state2 = authReducer(
        state1,
        AuthActions.setUserRole({ role: 'Viewer' })
      );

      expect(state1).not.toBe(state2);
      expect(state1.userRole).toBe('Owner');
      expect(state2.userRole).toBe('Viewer');
    });
  });

  describe('Unknown Actions', () => {
    it('should return current state for unknown actions', () => {
      const currentState: AuthState = {
        userRole: 'Owner',
        isLoggedIn: true,
      };

      const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
      const state = authReducer(currentState, unknownAction);

      expect(state).toBe(currentState); // Should return exact same reference
    });
  });
});
