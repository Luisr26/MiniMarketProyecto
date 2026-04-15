import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

interface Transaction {
  id: string;
  date: string;
  customer: string;
  items: string;
  amount: string;
  status: 'PAID' | 'PENDING';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzTableModule, NzInputModule, NzButtonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  providers: [NzMessageService]
})
export class AdminDashboardComponent implements OnInit {
  searchQuery = '';
  topSearchQuery = '';

  // Real data
  transactions: Transaction[] = [];
  activeStockCount = 0;
  revenueToday = 0;
  criticalAlerts = 0;
  userName = 'Admin';

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const session = this.authService.currentUserValue;
    if (session) this.userName = session.name;

    // Get Products
    const products = this.storageService.getProducts();
    this.activeStockCount = products.length;
    this.criticalAlerts = products.filter((p: any) => p.stock <= 10).length;

    // Get History & Revenue
    const history = this.storageService.getHistory();
    this.revenueToday = history.reduce((sum: number, t: any) => sum + (t.total || 0), 0);

    // Map to table (first 5)
    this.transactions = history.slice(0, 5).map((t: any) => ({
      id: '#' + t.id,
      date: t.time || 'N/A',
      customer: 'Público General',
      items: t.items + ' Items',
      amount: '$' + t.total.toFixed(2),
      status: 'PAID'
    }));
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('Sincronización de inventario completada correctamente.');
  }

  onGlobalSearch() {
    this.message.loading('Buscando en todos los módulos: ' + this.topSearchQuery, { nzDuration: 1000 });
  }
}
