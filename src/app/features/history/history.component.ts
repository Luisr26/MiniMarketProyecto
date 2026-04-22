import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../core/services/storage.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

interface Transaction {
  id: string;
  time: string;
  items: number;
  method: 'EFECTIVO' | 'TARJETA' | 'TRANSFER';
  total: number;
  status: string;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzButtonModule, NzPaginationModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
  searchQuery = '';
  methodFilter: 'ALL' | 'EFECTIVO' | 'TARJETA' | 'TRANSFER' = 'ALL';
  transactions: Transaction[] = [];
  
  totalToday = 0;
  transactionCount = 0;

  private subs = new Subscription();

  // Turn Summary
  turno = {
    cajero: 'Roberto Méndez',
    inicio: '08:00 AM',
    ventasTotales: 0,
    efectivoEnCaja: 0
  };

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadHistory();
    this.subs.add(this.storageService.history$.subscribe(() => {
      this.loadHistory();
    }));
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadHistory() {
    const history = this.storageService.getHistory();
    this.transactions = history;
    this.transactionCount = this.transactions.length;
    this.totalToday = this.transactions.reduce((sum, t) => sum + t.total, 0);
    this.turno.cajero = this.authService.currentUserValue?.name || 'Invitado';
    this.turno.ventasTotales = this.transactionCount;
    this.turno.efectivoEnCaja = this.transactions
      .filter(t => t.method === 'EFECTIVO')
      .reduce((sum, t) => sum + t.total, 0);
  }

  get filteredTransactions(): Transaction[] {
    let result = this.transactions;
    const q = this.searchQuery.toLowerCase();
    
    if (q) {
      result = result.filter(t => 
        t.id.toLowerCase().includes(q)
      );
    }

    if (this.methodFilter !== 'ALL') {
      result = result.filter(t => t.method === this.methodFilter);
    }
    
    return result;
  }

  generateDailyReport() {
    this.message.loading('Generando reporte del día...', { nzDuration: 2000 });
    setTimeout(() => {
      this.message.success('Reporte generado correctamente (PDF)');
    }, 2100);
  }

  viewDetail(t: Transaction) {
    this.message.info(`Visualizando detalle de la venta ${t.id}`);
  }

  reprintTicket(t: Transaction) {
    this.message.success(`Reimprimiendo ticket ${t.id}...`);
  }

  logout() {
    this.authService.logout();
  }
}
