import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzCardModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  stats = {
    totalRevenue: 0,
    avgTicket: 0,
    transactionCount: 0,
    growth: 15.4
  };

  weeklySales = [
    { day: 'Lunes', amount: 1250, height: 45 },
    { day: 'Martes', amount: 1800, height: 65 },
    { day: 'Miércoles', amount: 1500, height: 55 },
    { day: 'Jueves', amount: 2100, height: 75 },
    { day: 'Viernes', amount: 2800, height: 95 },
    { day: 'Sábado', amount: 2400, height: 85 },
    { day: 'Domingo', amount: 1900, height: 70 }
  ];

  categories = [
    { name: 'Lácteos', percent: 35, color: '#4f46e5' },
    { name: 'Granos', percent: 25, color: '#10b981' },
    { name: 'Frutas/Verduras', percent: 20, color: '#f59e0b' },
    { name: 'Snacks', percent: 15, color: '#f43f5e' },
    { name: 'Otros', percent: 5, color: '#64748b' }
  ];

  constructor(private storageService: StorageService) {}

  ngOnInit() {
    this.calculateStats();
  }

  calculateStats() {
    const history = this.storageService.getHistory();
    this.stats.transactionCount = history.length;
    this.stats.totalRevenue = history.reduce((sum, t) => sum + t.total, 0);
    this.stats.avgTicket = this.stats.transactionCount > 0 
      ? this.stats.totalRevenue / this.stats.transactionCount 
      : 0;
  }
}
