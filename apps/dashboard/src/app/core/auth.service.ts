import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type UserRole = 'Owner' | 'Admin' | 'Viewer';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userRoleSubject = new BehaviorSubject<UserRole>('Admin'); // Default to Admin
  userRole$ = this.userRoleSubject.asObservable();

  constructor() {
    // Check localStorage for saved role
    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (savedRole && this.isValidRole(savedRole)) {
      this.userRoleSubject.next(savedRole);
    }
  }

  setUserRole(role: UserRole): void {
    if (this.isValidRole(role)) {
      localStorage.setItem('userRole', role);
      this.userRoleSubject.next(role);
    }
  }

  getCurrentRole(): UserRole {
    return this.userRoleSubject.value;
  }

  isOwnerOrAdmin(): boolean {
    const currentRole = this.getCurrentRole();
    return currentRole === 'Owner' || currentRole === 'Admin';
  }

  private isValidRole(role: string): role is UserRole {
    return ['Owner', 'Admin', 'Viewer'].includes(role);
  }
}
