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

interface Entry {
  description: string;
  sku: string;
  time: string;
  supplier: string;
  quantity: string;
}

@Component({
  selector: 'app-bodeguero-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzTableModule, NzInputModule, NzButtonModule],
  templateUrl: './bodeguero-dashboard.component.html',
  styleUrl: './bodeguero-dashboard.component.css',
  providers: [NzMessageService]
})
export class BodegueroDashboardComponent implements OnInit {
  topSearchQuery = '';

  // Real data
  entries: Entry[] = [];
  activeSkusCount = 0;
  entriesTodayCount = 0;
  lowStockAlerts: any[] = [];
  userName = 'Bodeguero';

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
    this.activeSkusCount = products.length;

    // Filter low stock
    this.lowStockAlerts = products
      .filter((p: any) => p.stock <= 10)
      .slice(0, 3); // Top 3 critical

    // Mock entries today (or calculate from a registry if we had one)
    this.entriesTodayCount = 14; 

    // Simulation table data from products
    this.entries = products.slice(0, 5).map((p: any) => ({
      description: p.name,
      sku: p.sku,
      time: '09:45 AM',
      supplier: p.supplier || 'Proveedor Genérico',
      quantity: '+' + Math.floor(Math.random() * 50 + 10)
    }));
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('Recepción de mercancía programada para las 2:00 PM.');
  }

  onGlobalSearch() {
    this.message.loading('Buscando en almacén: ' + this.topSearchQuery, { nzDuration: 1000 });
  }

  orderProduct(p: any) {
    this.message.success('Pedido de reabastecimiento enviado para: ' + p.name);
  }
}
