import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  timestamp: Date;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'VERIFY';
  entity: 'PRODUCT' | 'TRANSACTION' | 'USER' | 'SUPPLIER' | 'INVENTORY';
  entityId: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  status: 'SUCCESS' | 'FAILED' | 'WARNING';
  message: string;
  userId?: number;
}

export interface DataIntegrityReport {
  timestamp: Date;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  issues: {
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    affectedRecords: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  
  private auditLogs$ = new BehaviorSubject<AuditLog[]>([]);
  private integrityReport$ = new BehaviorSubject<DataIntegrityReport | null>(null);
  private syncStatus$ = new BehaviorSubject<'idle' | 'syncing' | 'completed'>('idle');
  
  public auditLogs = this.auditLogs$.asObservable();
  public integrityReport = this.integrityReport$.asObservable();
  public syncStatus = this.syncStatus$.asObservable();

  constructor() {
    this.initializeAuditLog();
  }

  /**
   * Initialize audit log from localStorage
   */
  private initializeAuditLog() {
    const stored = localStorage.getItem('auditLogs');
    if (stored) {
      try {
        this.auditLogs$.next(JSON.parse(stored));
      } catch (e) {
        this.auditLogs$.next([]);
      }
    }
  }

  /**
   * Log an action
   */
  logAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'VERIFY',
    entity: 'PRODUCT' | 'TRANSACTION' | 'USER' | 'SUPPLIER' | 'INVENTORY',
    entityId: number,
    changes: any[] = [],
    status: 'SUCCESS' | 'FAILED' | 'WARNING' = 'SUCCESS',
    message: string = ''
  ) {
    const log: AuditLog = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      entity,
      entityId,
      changes,
      status,
      message
    };

    const currentLogs = this.auditLogs$.value;
    const newLogs = [log, ...currentLogs].slice(0, 1000); // Keep last 1000 logs
    
    this.auditLogs$.next(newLogs);
    this.persistAuditLogs(newLogs);
  }

  /**
   * Verify product SKU integrity
   */
  verifySKUIntegrity(products: any[]): DataIntegrityReport {
    const issues: DataIntegrityReport['issues'] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    // Check for duplicate SKUs
    const skuMap = new Map();
    products.forEach(p => {
      if (skuMap.has(p.sku)) {
        failedChecks++;
        issues.push({
          type: 'DUPLICATE_SKU',
          severity: 'CRITICAL',
          description: `SKU duplicado: ${p.sku}`,
          affectedRecords: 2
        });
      } else {
        skuMap.set(p.sku, p.id);
        passedChecks++;
      }
    });

    // Check for missing prices
    products.forEach(p => {
      if (!p.price || p.price <= 0) {
        failedChecks++;
        issues.push({
          type: 'INVALID_PRICE',
          severity: 'HIGH',
          description: `Precio inválido para ${p.name}: $${p.price}`,
          affectedRecords: 1
        });
      }
    });

    // Check for invalid stock
    products.forEach(p => {
      if (p.stock < 0) {
        failedChecks++;
        issues.push({
          type: 'NEGATIVE_STOCK',
          severity: 'CRITICAL',
          description: `Stock negativo: ${p.name} (${p.stock} unidades)`,
          affectedRecords: 1
        });
      } else if (p.stock < p.minStock || 0) {
        issues.push({
          type: 'LOW_STOCK',
          severity: 'MEDIUM',
          description: `Stock bajo: ${p.name}`,
          affectedRecords: 1
        });
      }
    });

    const report: DataIntegrityReport = {
      timestamp: new Date(),
      totalChecks: products.length * 3,
      passedChecks,
      failedChecks,
      warnings: issues.length,
      issues
    };

    this.integrityReport$.next(report);
    this.logAction('VERIFY', 'PRODUCT', 0, [], failedChecks === 0 ? 'SUCCESS' : 'WARNING', 
      `Verificación completada: ${passedChecks} pasadas, ${failedChecks} fallidas`);

    return report;
  }

  /**
   * Verify invoice integrity
   */
  verifyInvoiceIntegrity(transactions: any[]): DataIntegrityReport {
    const issues: DataIntegrityReport['issues'] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    transactions.forEach(t => {
      // Check invoice number
      if (!t.invoice || t.invoice.trim() === '') {
        failedChecks++;
        issues.push({
          type: 'MISSING_INVOICE',
          severity: 'HIGH',
          description: `Transacción sin número de factura: ID ${t.id}`,
          affectedRecords: 1
        });
      } else {
        passedChecks++;
      }

      // Check total
      if (!t.total || t.total <= 0) {
        failedChecks++;
        issues.push({
          type: 'INVALID_TOTAL',
          severity: 'HIGH',
          description: `Total inválido: $${t.total}`,
          affectedRecords: 1
        });
      } else {
        passedChecks++;
      }

      // Check payment method
      if (!t.paymentMethod) {
        failedChecks++;
        issues.push({
          type: 'MISSING_PAYMENT_METHOD',
          severity: 'MEDIUM',
          description: `Método de pago faltante: ID ${t.id}`,
          affectedRecords: 1
        });
      } else {
        passedChecks++;
      }
    });

    const report: DataIntegrityReport = {
      timestamp: new Date(),
      totalChecks: transactions.length * 3,
      passedChecks,
      failedChecks,
      warnings: issues.length,
      issues
    };

    this.integrityReport$.next(report);
    this.logAction('VERIFY', 'TRANSACTION', 0, [], failedChecks === 0 ? 'SUCCESS' : 'WARNING',
      `Verificación de facturas: ${passedChecks} pasadas, ${failedChecks} fallidas`);

    return report;
  }

  /**
   * Verify price consistency
   */
  verifyPriceConsistency(products: any[]): DataIntegrityReport {
    const issues: DataIntegrityReport['issues'] = [];
    let passedChecks = 0;
    let failedChecks = 0;

    products.forEach(p => {
      // Check cost vs price
      if (p.cost && p.price && p.cost >= p.price) {
        failedChecks++;
        issues.push({
          type: 'COST_EXCEEDS_PRICE',
          severity: 'CRITICAL',
          description: `Costo ($${p.cost}) no puede ser mayor o igual al precio ($${p.price})`,
          affectedRecords: 1
        });
      } else {
        passedChecks++;
      }

      // Check price progression
      if (p.wholesalePrice && p.price && p.wholesalePrice > p.price) {
        failedChecks++;
        issues.push({
          type: 'INVALID_WHOLESALE_PRICE',
          severity: 'HIGH',
          description: `Precio mayorista ($${p.wholesalePrice}) mayor al minorista ($${p.price})`,
          affectedRecords: 1
        });
      } else {
        passedChecks++;
      }
    });

    const report: DataIntegrityReport = {
      timestamp: new Date(),
      totalChecks: products.length * 2,
      passedChecks,
      failedChecks,
      warnings: issues.length,
      issues
    };

    this.integrityReport$.next(report);
    this.logAction('VERIFY', 'PRODUCT', 0, [], failedChecks === 0 ? 'SUCCESS' : 'WARNING',
      `Verificación de precios: ${passedChecks} pasadas, ${failedChecks} fallidas`);

    return report;
  }

  /**
   * Full data sync and verification
   */
  fullDataSync(products: any[], transactions: any[]): void {
    this.syncStatus$.next('syncing');

    // Simulate sync process
    setTimeout(() => {
      this.logAction('SYNC', 'INVENTORY', 0, [], 'SUCCESS', 'Sincronización de datos completada');
      
      // Run all verifications
      this.verifySKUIntegrity(products);
      this.verifyInvoiceIntegrity(transactions);
      this.verifyPriceConsistency(products);

      this.syncStatus$.next('completed');
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        this.syncStatus$.next('idle');
      }, 3000);
    }, 1500);
  }

  /**
   * Get audit logs
   */
  getAuditLogs(): AuditLog[] {
    return this.auditLogs$.value;
  }

  /**
   * Get integrity report
   */
  getIntegrityReport(): DataIntegrityReport | null {
    return this.integrityReport$.value;
  }

  /**
   * Clear old logs
   */
  clearOldLogs(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filtered = this.auditLogs$.value.filter(log => new Date(log.timestamp) > cutoffDate);
    this.auditLogs$.next(filtered);
    this.persistAuditLogs(filtered);

    this.logAction('SYNC', 'INVENTORY', 0, [], 'SUCCESS', 
      `Logs antiguos eliminados. ${this.auditLogs$.value.length} registros restantes.`);
  }

  /**
   * Export audit logs
   */
  exportLogs(): string {
    return JSON.stringify(this.auditLogs$.value, null, 2);
  }

  /**
   * Persist logs to localStorage
   */
  private persistAuditLogs(logs: AuditLog[]): void {
    try {
      localStorage.setItem('auditLogs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Unable to persist audit logs to localStorage', e);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): number {
    return Math.floor(Math.random() * 1000000);
  }
}
