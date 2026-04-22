import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzCardModule, NzTableModule, NgApexchartsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  
  totalRevenue = 0;
  totalTransactions = 0;
  averageTicket = 0;
  topCategory = 'Abarrotes';
  
  criticalStockCount = 0;

  salesVsPurchasesChart: any;
  stockCriticalChart: any;

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
    this.initCharts();
    this.calculateStats();
  }

  initCharts() {
    this.salesVsPurchasesChart = {
      series: [
        { name: 'Ventas', data: [120000, 150000, 135000, 180000, 250000, 310000, 280000] },
        { name: 'Compras', data: [80000, 100000, 90000, 120000, 170000, 210000, 190000] }
      ],
      chart: { type: 'area', height: 300, toolbar: { show: false } },
      colors: ['#4F46E5', '#10B981'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { categories: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] },
      legend: { position: 'top' },
      grid: { borderColor: '#f1f5f9' }
    };

    this.stockCriticalChart = {
      series: [12, 8, 5],
      chart: { type: 'donut', height: 250 },
      labels: ['Stock Bajo', 'Stock Crítico', 'Stock Normal'],
      colors: ['#F59E0B', '#EF4444', '#10B981'],
      legend: { position: 'bottom' },
      plotOptions: { pie: { donut: { size: '65%' } } }
    };
  }

  calculateStats() {
    const history = this.storageService.getHistory();
    const products = this.storageService.getProducts();
    
    this.totalTransactions = history.length;
    this.totalRevenue = history.reduce((acc, curr) => acc + curr.total, 0);
    this.averageTicket = this.totalTransactions > 0 ? this.totalRevenue / this.totalTransactions : 0;
    this.criticalStockCount = products.filter((p: any) => p.stock <= 10).length;
  }
}
