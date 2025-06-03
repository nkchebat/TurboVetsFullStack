import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { ApiService, AuditLog } from '../../core/api.service';
import { selectIsOwnerOrAdmin } from '../../state/selectors';

@Component({
  selector: 'app-audit-log',
  template: `
    <div class="p-4">
      <h1 class="text-2xl font-bold mb-6 dark:text-white">Audit Log</h1>
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <!-- Add your audit log content here -->
        <p class="text-gray-600 dark:text-gray-300">
          Audit log functionality coming soon...
        </p>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class AuditLogComponent implements OnInit {
  auditLogs$: Observable<AuditLog[]>;
  isOwnerOrAdmin$: Observable<boolean>;

  constructor(private apiService: ApiService, private store: Store) {
    this.auditLogs$ = this.apiService.getAuditLogs();
    this.isOwnerOrAdmin$ = this.store.select(selectIsOwnerOrAdmin);
  }

  ngOnInit(): void {
    // Check if user has permission to view audit logs
    this.isOwnerOrAdmin$.subscribe((isOwnerOrAdmin) => {
      if (!isOwnerOrAdmin) {
        // Redirect or show error message
        console.error('Access denied: Only Owner or Admin can view audit logs');
      }
    });
  }
}
