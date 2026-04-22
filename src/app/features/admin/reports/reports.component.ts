import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzCardModule, NgApexchartsModule],
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

  criticalStockCount = 0;

  // Chart configurations
  revenueChart: any;
  categoryDonutChart: any;
  salesVsPurchasesChart: any;
  stockStatusChart: any;
  weeklyBarChart: any;

  constructor(private storageService: StorageService) {}

  ngOnInit() {
    this.calculateStats();
    this.initCharts();
  }

  calculateStats() {
    const history = this.storageService.getHistory();
    const products = this.storageService.getProducts();
    this.stats.transactionCount = history.length;
    this.stats.totalRevenue = history.reduce((sum, t) => sum + t.total, 0);
    this.stats.avgTicket = this.stats.transactionCount > 0
      ? this.stats.totalRevenue / this.stats.transactionCount
      : 0;
    this.criticalStockCount = products.filter((p: any) => (p.stock ?? p.stock_actual ?? 0) <= 10).length;
  }

  initCharts() {
    // Revenue Trend Area Chart
    this.revenueChart = {
      series: [
        { name: 'Ventas', data: [1250, 1800, 1500, 2100, 2800, 2400, 1900] },
        { name: 'Objetivo', data: [2000, 2000, 2000, 2000, 2000, 2000, 2000] }
      ],
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif',
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      colors: ['#4F46E5', '#94A3B8'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0.05,
          stops: [0, 100]
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
      xaxis: {
        categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        labels: { style: { colors: '#9CA3AF', fontSize: '11px', fontWeight: 600 } }
      },
      yaxis: {
        labels: {
          style: { colors: '#9CA3AF', fontSize: '11px' },
          formatter: (val: number) => '$' + val.toLocaleString()
        }
      },
      legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      tooltip: {
        y: { formatter: (val: number) => '$' + val.toLocaleString() }
      }
    };

    // Category Distribution Donut
    this.categoryDonutChart = {
      series: [35, 25, 20, 15, 5],
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Inter, sans-serif',
        animations: { enabled: true, speed: 800 }
      },
      labels: ['Lácteos', 'Granos', 'Frutas/Verduras', 'Snacks', 'Otros'],
      colors: ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#94A3B8'],
      legend: {
        position: 'bottom',
        fontWeight: 600,
        labels: { colors: '#4B5563' }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: true, fontWeight: 700, fontSize: '14px', color: '#1F2937' },
              value: { show: true, fontWeight: 800, fontSize: '22px', color: '#10165F', formatter: (val: string) => val + '%' },
              total: { show: true, label: 'Total', fontWeight: 700, color: '#9CA3AF', formatter: () => '100%' }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 3, colors: ['#fff'] }
    };

    // Sales vs Purchases Comparison
    this.salesVsPurchasesChart = {
      series: [
        { name: 'Ventas', data: [1250, 1800, 1500, 2100, 2800, 2400, 1900] },
        { name: 'Compras', data: [800, 1200, 950, 1400, 1800, 1600, 1250] }
      ],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      colors: ['#4F46E5', '#10B981'],
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '55%',
          dataLabels: { position: 'top' }
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        labels: { style: { colors: '#9CA3AF', fontSize: '11px', fontWeight: 600 } }
      },
      yaxis: {
        labels: {
          style: { colors: '#9CA3AF', fontSize: '11px' },
          formatter: (val: number) => '$' + val.toLocaleString()
        }
      },
      legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
    };

    // Stock Status Radial Bar
    this.stockStatusChart = {
      series: [72, 18, 10],
      chart: {
        type: 'radialBar',
        height: 280,
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        radialBar: {
          hollow: { size: '35%' },
          track: { background: '#f1f5f9' },
          dataLabels: {
            name: { fontSize: '12px', fontWeight: 700, color: '#6B7280' },
            value: { fontSize: '18px', fontWeight: 800, color: '#1F2937', formatter: (val: number) => val + '%' },
            total: { show: true, label: 'Salud', fontWeight: 700, color: '#9CA3AF', formatter: () => '72%' }
          }
        }
      },
      labels: ['Stock OK', 'Stock Bajo', 'Crítico'],
      colors: ['#10B981', '#F59E0B', '#EF4444'],
      legend: { position: 'bottom', fontWeight: 600 }
    };

    // Weekly Performance Bar
    this.weeklyBarChart = {
      series: [{ name: 'Transacciones', data: [45, 52, 48, 65, 85, 110, 95] }],
      chart: {
        type: 'bar',
        height: 200,
        toolbar: { show: false },
        sparkline: { enabled: false },
        fontFamily: 'Inter, sans-serif'
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '50%',
          distributed: true
        }
      },
      colors: ['#10165F', '#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5', '#5c6bc0'],
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        labels: { style: { colors: '#9CA3AF', fontSize: '11px', fontWeight: 600 } }
      },
      yaxis: {
        labels: {
          style: { colors: '#9CA3AF', fontSize: '11px' }
        }
      },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      legend: { show: false }
    };
  }
}
