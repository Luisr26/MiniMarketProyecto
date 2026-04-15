import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { StorageService } from '../../core/services/storage.service';
import { AuthService } from '../../core/services/auth.service';

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
export class HistoryComponent implements OnInit {
  searchQuery = '';
  transactions: Transaction[] = [];
  
  // Dashboard stats
  totalToday = 2450.80;
  transactionCount = 42;

  // Turn Summary (matching mockup)
  turno = {
    cajero: 'Roberto Méndez',
    inicio: '08:00 AM',
    ventasTotales: 42,
    efectivoEnCaja: 1120.50
  };

  // Recent Activity
  recentActivity = [
    { type: 'cierre', title: 'Cierre de Caja Parcial', time: 'Hace 15 min', detail: 'Auditado por Admin', color: '#10B981' },
    { type: 'anulacion', title: 'Anulación de Venta F-0885', time: 'Hace 45 min', detail: 'Razón: Error de digitación', color: '#EF4444' },
    { type: 'cambio', title: 'Cambio de Turno Programado', time: 'En 1 hora', detail: 'Cajero: Elena G.', color: '#10165F' }
  ];

  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.transactions = this.storageService.getHistory();
    this.turno.cajero = this.authService.currentUserValue?.name || 'Invitado';
  }

  get filteredTransactions(): Transaction[] {
    if (!this.searchQuery.trim()) return this.transactions;
    const q = this.searchQuery.toLowerCase();
    return this.transactions.filter(t => 
      t.id.toLowerCase().includes(q) || 
      t.method.toLowerCase().includes(q)
    );
  }

  logout() {
    this.authService.logout();
  }
}
