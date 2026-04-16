import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzCardModule, NzTableModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  
  // KPIs
  totalRevenue = 0;
  totalTransactions = 0;
  averageTicket = 0;
  topCategory = 'Abarrotes';

  categorySales = [
    { category: 'Lácteos', sales: 450000, percentage: 35, color: '#10165F' },
    { category: 'Granos', sales: 280000, percentage: 22, color: '#4F46E5' },
    { category: 'Aceites', sales: 180000, percentage: 14, color: '#10B981' },
    { category: 'Bebidas', sales: 320000, percentage: 25, color: '#F59E0B' },
    { category: 'Otros', sales: 50000, percentage: 4, color: '#94A3B8' }
  ];

  weeklyPerformance = [
    { day: 'Lun', sales: 120000, transactions: 45 },
    { day: 'Mar', sales: 150000, transactions: 52 },
    { day: 'Mie', sales: 135000, transactions: 48 },
    { day: 'Jue', sales: 180000, transactions: 65 },
    { day: 'Vie', sales: 250000, transactions: 85 },
    { day: 'Sab', sales: 310000, transactions: 110 },
    { day: 'Dom', sales: 280000, transactions: 95 }
  ];

  constructor(private storageService: StorageService) {}

  ngOnInit() {
    this.calculateStats();
  }

  calculateStats() {
    const history = this.storageService.getHistory();
    this.totalTransactions = history.length;
    this.totalRevenue = history.reduce((acc, curr) => acc + curr.total, 0);
    this.averageTicket = this.totalTransactions > 0 ? this.totalRevenue / this.totalTransactions : 0;
  }
}
