import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

type StockStatus = 'STOCK SUFICIENTE' | 'STOCK REGULAR' | 'BAJO STOCK' | 'SIN STOCK';

interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  stock: number;
  supplier: string;
  lastEntry: string;
  status: StockStatus;
}

@Component({
  selector: 'app-inventory-bodeguero',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzButtonModule],
  templateUrl: './inventory-bodeguero.component.html',
  styleUrl: './inventory-bodeguero.component.css',
  providers: [NzMessageService]
})
export class InventoryBodegueroComponent implements OnInit {

  searchQuery = '';
  items: any[] = [];

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    const raw = this.storageService.getProducts();
    this.items = raw.map((p: any) => ({
      ...p,
      status: this.mapStockToStatus(p.stock),
      lastEntry: '15/04/2026' // Placeholder date
    }));
  }

  mapStockToStatus(stock: number): StockStatus {
    if (stock <= 0) return 'SIN STOCK';
    if (stock <= 10) return 'BAJO STOCK';
    if (stock <= 30) return 'STOCK REGULAR';
    return 'STOCK SUFICIENTE';
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
     this.message.info('Actualizaciones de stock pendientes: 0');
  }

  showSettings() {
    this.message.warning('Módulo de configuración en mantenimiento.');
  }

  // Summary stats
  totalSkus = 1248;
  criticalStock = 24;
  estimatedValue = '$34.2k';

  // Pagination
  currentPage = 1;
  pageSize = 8;

  get filteredItems() {
    if (!this.searchQuery.trim()) return this.items;
    const q = this.searchQuery.toLowerCase();
    return this.items.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.sku.toLowerCase().includes(q) || 
      i.supplier.toLowerCase().includes(q)
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredItems.length / this.pageSize);
  }

  get paginatedItems() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredItems.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  getStatusClass(status: StockStatus): string {
    switch (status) {
      case 'STOCK SUFICIENTE': return 'status-good';
      case 'STOCK REGULAR': return 'status-regular';
      case 'BAJO STOCK': return 'status-low';
      case 'SIN STOCK': return 'status-out';
      default: return '';
    }
  }

  getRowHighlight(status: StockStatus): string {
    return status === 'BAJO STOCK' || status === 'SIN STOCK' ? 'row-critical' : '';
  }
}
