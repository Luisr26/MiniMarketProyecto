import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AuditService, AuditLog } from '../../../core/services/audit.service';
import { StorageService } from '../../../core/services/storage.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzTableModule, NzButtonModule, NzBadgeModule, NzTagModule, NzModalModule, NgApexchartsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css'],
  providers: [AuditService, NzMessageService, NzModalService]
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  
  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  
  filterAction: string | null = null;
  filterEntity: string | null = null;
  filterStatus: string | null = null;
  searchQuery = '';
  
  pageIndex = 1;
  pageSize = 20;
  isLoading = false;
  
  lastSync = new Date();
  syncStatus = 'idle';
  
  private subs = new Subscription();

  constructor(
    private auditService: AuditService,
    private storageService: StorageService,
    private message: NzMessageService,
    private modalService: NzModalService
  ) {}

  ngOnInit() {
    this.subscribeToAuditLogs();
    this.subscribeToSyncStatus();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /**
   * Subscribe to audit logs
   */
  private subscribeToAuditLogs() {
    this.subs.add(
      this.auditService.auditLogs.subscribe(logs => {
        this.auditLogs = logs;
        this.filterLogs();
      })
    );
  }

  /**
   * Subscribe to sync status
   */
  private subscribeToSyncStatus() {
    this.subs.add(
      this.auditService.syncStatus.subscribe(status => {
        this.syncStatus = status;
      })
    );
  }

  /**
   * Filter logs
   */
  private filterLogs() {
    this.isLoading = true;

    let result = [...this.auditLogs];
    const q = this.searchQuery.toLowerCase().trim();

    // Search
    if (q) {
      result = result.filter(log =>
        log.message.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    }

    // Action filter
    if (this.filterAction && this.filterAction !== 'all') {
      result = result.filter(log => log.action === this.filterAction);
    }

    // Entity filter
    if (this.filterEntity && this.filterEntity !== 'all') {
      result = result.filter(log => log.entity === this.filterEntity);
    }

    // Status filter
    if (this.filterStatus && this.filterStatus !== 'all') {
      result = result.filter(log => log.status === this.filterStatus);
    }

    setTimeout(() => {
      this.filteredLogs = result;
      this.isLoading = false;
    }, 200);
  }

  /**
   * Update filters
   */
  onFilterChange() {
    this.pageIndex = 1;
    this.filterLogs();
  }

  /**
   * Run full data verification
   */
  runFullVerification() {
    this.message.loading('Ejecutando verificación integral de datos...');

    this.subs.add(
      this.storageService.products$.subscribe(products => {
        this.subs.add(
          this.storageService.history$.subscribe(transactions => {
            this.auditService.fullDataSync(products, transactions);
            setTimeout(() => {
              this.message.success('Verificación completada');
              this.lastSync = new Date();
            }, 2000);
          })
        );
      })
    );
  }

  /**
   * Clear old logs
   */
  clearOldLogs() {
    this.modalService.confirm({
      nzTitle: 'Limpiar logs antiguos',
      nzContent: '¿Eliminar logs con más de 30 días?',
      nzOkText: 'Sí, limpiar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.auditService.clearOldLogs(30);
        this.message.success('Logs antiguos eliminados');
      }
    });
  }

  /**
   * Export logs
   */
  exportLogs() {
    const data = this.auditService.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.message.success('Logs exportados correctamente');
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'SUCCESS': 'green',
      'WARNING': 'orange',
      'FAILED': 'red'
    };
    return colors[status] || 'default';
  }

  /**
   * Format timestamp
   */
  formatTime(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
