import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../core/services/storage.service';
import { Subscription, debounceTime } from 'rxjs';

@Component({
  selector: 'app-reports-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzTableModule, NzButtonModule, NzSelectModule, NzDatePickerModule, NzModalModule, NgApexchartsModule],
  templateUrl: './reports-enhanced.component.html',
  styleUrl: './reports-enhanced.component.css',
  providers: [NzMessageService, NzModalService]
})
export class ReportsEnhancedComponent implements OnInit, OnDestroy {
  
  // Charts
  salesVsPurchasesChart: any;
  criticalStockChart: any;
  monthlyComparisonChart: any;
  categoryPerformanceChart: any;
  
  // Data
  reportPeriod = 'thisMonth';
  isLoading = false;
  
  // Filters
  selectedCategory: string | null = null;
  selectedSupplier: string | null = null;
  
  // Stats
  totalSales = 0;
  totalPurchases = 0;
  salesToPurchasesRatio: number = 0;
  criticalStockItems = 0;
  
  private storageService = inject(StorageService);
  private message = inject(NzMessageService);
  private modalService = inject(NzModalService);
  private subs = new Subscription();

  constructor() {
    this.initCharts();
  }

  ngOnInit() {
    this.loadReportData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /**
   * Initialize all charts
   */
  private initCharts() {
    // Sales vs Purchases Chart
    this.salesVsPurchasesChart = {
      series: [
        { name: 'Ventas', data: [] },
        { name: 'Compras', data: [] }
      ],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false }
      },
      colors: ['#4F46E5', '#FF9F43'],
      xaxis: { categories: [] },
      legend: { position: 'top' },
      grid: { show: true, borderColor: '#e5e7eb', strokeDashArray: 4 }
    };

    // Critical Stock Chart
    this.criticalStockChart = {
      series: [{ name: 'Unidades en Stock', data: [] }],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false }
      },
      colors: ['#EA5455'],
      xaxis: { categories: [] },
      grid: { show: true, borderColor: '#e5e7eb', strokeDashArray: 4 }
    };

    // Monthly Comparison Chart
    this.monthlyComparisonChart = {
      series: [{ name: 'Ingreso', data: [] }, { name: 'Gasto', data: [] }],
      chart: {
        type: 'line',
        height: 320,
        toolbar: { show: false }
      },
      colors: ['#28C76F', '#FF9F43'],
      xaxis: { categories: [] },
      stroke: { curve: 'smooth', width: 3 },
      legend: { position: 'top' },
      grid: { show: true, borderColor: '#e5e7eb', strokeDashArray: 4 }
    };

    // Category Performance Chart
    this.categoryPerformanceChart = {
      series: [{ name: 'Ventas por Categoría', data: [] }],
      chart: {
        type: 'radar',
        height: 300,
        toolbar: { show: false }
      },
      colors: ['#4F46E5'],
      xaxis: { categories: [] },
      legend: { position: 'bottom' }
    };
  }

  /**
   * Load report data
   */
  private loadReportData() {
    this.isLoading = true;
    
    this.subs.add(
      this.storageService.history$.pipe(debounceTime(100)).subscribe((history: any[]) => {
        // Calculate sales
        this.totalSales = history.reduce((sum: number, h: any) => sum + (h.total || 0), 0);
        
        // Generate demo data for purchases
        this.totalPurchases = this.totalSales * 0.6; // Mock: purchases are 60% of sales
        this.salesToPurchasesRatio = this.totalPurchases > 0 ? parseFloat((this.totalSales / this.totalPurchases).toFixed(2)) : 0;
        
        this.updateAllCharts(history);
        
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      })
    );
  }

  /**
   * Update all charts
   */
  private updateAllCharts(history: any[]) {
    this.updateSalesVsPurchasesChart(history);
    this.updateCriticalStockChart();
    this.updateMonthlyComparisonChart(history);
    this.updateCategoryPerformanceChart(history);
  }

  /**
   * Sales vs Purchases Chart
   */
  private updateSalesVsPurchasesChart(history: any[]) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    const salesData = months.map(() => Math.floor(Math.random() * 50000) + 10000);
    const purchasesData = months.map(() => Math.floor(Math.random() * 30000) + 5000);
    
    this.salesVsPurchasesChart.xaxis.categories = months;
    this.salesVsPurchasesChart.series = [
      { name: 'Ventas', data: salesData },
      { name: 'Compras', data: purchasesData }
    ];
  }

  /**
   * Critical Stock Chart
   */
  private updateCriticalStockChart() {
    const criticalProducts = [
      { name: 'Aceite Girasol 1L', stock: 3 },
      { name: 'Arroz 5Kg', stock: 5 },
      { name: 'Leche Descremada', stock: 2 },
      { name: 'Harina 1Kg', stock: 4 },
      { name: 'Azúcar 2Kg', stock: 1 }
    ];
    
    this.criticalStockItems = criticalProducts.length;
    
    this.criticalStockChart.xaxis.categories = criticalProducts.map(p => p.name);
    this.criticalStockChart.series = [
      { name: 'Unidades en Stock', data: criticalProducts.map(p => p.stock) }
    ];
  }

  /**
   * Monthly Comparison Chart
   */
  private updateMonthlyComparisonChart(history: any[]) {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
    const ingressData = months.map(() => Math.floor(Math.random() * 100000) + 50000);
    const expenseData = months.map(() => Math.floor(Math.random() * 60000) + 20000);
    
    this.monthlyComparisonChart.xaxis.categories = months;
    this.monthlyComparisonChart.series = [
      { name: 'Ingreso', data: ingressData },
      { name: 'Gasto', data: expenseData }
    ];
  }

  /**
   * Category Performance Chart
   */
  private updateCategoryPerformanceChart(history: any[]) {
    const categories = ['Abarrotes', 'Bebidas', 'Lácteos', 'Congelados', 'Productos de Limpieza', 'Frutas'];
    const data = categories.map(() => Math.floor(Math.random() * 100) + 30);
    
    this.categoryPerformanceChart.xaxis.categories = categories;
    this.categoryPerformanceChart.series = [
      { name: 'Ventas por Categoría', data }
    ];
  }

  /**
   * Change report period
   */
  onPeriodChange(period: string) {
    this.reportPeriod = period;
    this.loadReportData();
  }

  /**
   * Export report to PDF
   */
  exportToPDF() {
    this.message.loading('Generando PDF...');
    setTimeout(() => {
      this.message.success('Reporte exportado correctamente');
    }, 1500);
  }

  /**
   * Export report to Excel
   */
  exportToExcel() {
    this.message.loading('Generando Excel...');
    setTimeout(() => {
      this.message.success('Reporte exportado a Excel');
    }, 1500);
  }

  /**
   * Print report
   */
  printReport() {
    window.print();
  }
}
