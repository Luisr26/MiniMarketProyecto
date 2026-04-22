import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../../core/services/storage.service';
import { Subscription, debounceTime } from 'rxjs';

interface SupplierPerformance {
  id: number;
  name: string;
  email: string;
  skus: number;
  totalSales: number;
  deliveryCount: number;
  rating: number;
  status: 'Activo' | 'Inactivo';
  registrationDate: string;
}

@Component({
  selector: 'app-suppliers-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzTableModule, NzInputModule, NzButtonModule, NzSelectModule, NzModalModule, NgApexchartsModule],
  templateUrl: './suppliers-dashboard.component.html',
  styleUrl: './suppliers-dashboard.component.css',
  providers: [NzMessageService, NzModalService]
})
export class SuppliersDashboardComponent implements OnInit, OnDestroy {
  
  // Data
  suppliers: SupplierPerformance[] = [];
  filteredSuppliers: SupplierPerformance[] = [];
  
  // Filters
  searchQuery = '';
  filterStatus: string | null = null;
  filterSkuRange: string | null = null;
  
  // Pagination
  pageIndex = 1;
  pageSize = 10;
  isLoading = false;
  
  // Charts
  salesChartOptions: any;
  deliveryChartOptions: any;
  ratingChartOptions: any;
  
  // Stats
  totalSuppliers = 0;
  activeSuppliersCount = 0;
  totalSkus = 0;
  avgRating = 0;
  
  private subs = new Subscription();

  constructor(
    private storageService: StorageService,
    private message: NzMessageService,
    private modalService: NzModalService
  ) {
    this.initCharts();
  }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /**
   * Load suppliers data
   */
  private loadData() {
    this.subs.add(
      this.storageService.suppliers$.pipe(
        debounceTime(100)
      ).subscribe(storedSuppliers => {
        // Map stored suppliers to performance metrics
        this.suppliers = storedSuppliers.map((s: any, index: number) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          skus: s.skus || 0,
          totalSales: Math.floor(Math.random() * 50000) + 5000, // Demo data
          deliveryCount: Math.floor(Math.random() * 50) + 5,
          rating: parseFloat((Math.random() * 2 + 3.5).toFixed(1)),
          status: index % 3 === 0 ? 'Inactivo' : 'Activo',
          registrationDate: s.registrationDate
        }));
        
        this.updateStats();
        this.filterSuppliers();
        this.updateCharts();
      })
    );
  }

  /**
   * Update KPI statistics
   */
  private updateStats() {
    this.totalSuppliers = this.suppliers.length;
    this.activeSuppliersCount = this.suppliers.filter(s => s.status === 'Activo').length;
    this.totalSkus = this.suppliers.reduce((sum, s) => sum + s.skus, 0);
    this.avgRating = this.suppliers.length > 0 
      ? parseFloat((this.suppliers.reduce((sum, s) => sum + s.rating, 0) / this.suppliers.length).toFixed(1))
      : 0;
  }

  /**
   * Filter suppliers based on search and filters
   */
  private filterSuppliers() {
    this.isLoading = true;
    
    let result = [...this.suppliers];
    const q = this.searchQuery.toLowerCase().trim();
    
    // Search filter
    if (q) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }
    
    // Status filter
    if (this.filterStatus && this.filterStatus !== 'all') {
      result = result.filter(s => s.status === this.filterStatus);
    }
    
    // SKU range filter
    if (this.filterSkuRange) {
      result = result.filter(s => {
        const skus = s.skus;
        switch (this.filterSkuRange) {
          case '0-50': return skus <= 50;
          case '51-100': return skus > 50 && skus <= 100;
          case '100+': return skus > 100;
          default: return true;
        }
      });
    }
    
    setTimeout(() => {
      this.filteredSuppliers = result;
      this.isLoading = false;
    }, 200);
  }

  /**
   * Handle filter changes
   */
  onFilterChange() {
    this.pageIndex = 1;
    this.filterSuppliers();
  }

  /**
   * Apply status filter
   */
  applyStatusFilter(status: string | null) {
    this.filterStatus = status === 'all' ? null : status;
    this.onFilterChange();
  }

  /**
   * Apply SKU range filter
   */
  applySkuFilter(range: string | null) {
    this.filterSkuRange = range === 'all' ? null : range;
    this.onFilterChange();
  }

  /**
   * Export to PDF
   */
  exportPDF() {
    this.message.loading('Generando PDF...', { nzDuration: 2 });
    setTimeout(() => {
      this.message.success('PDF exportado correctamente');
    }, 1500);
  }

  /**
   * Initialize charts
   */
  private initCharts() {
    // Sales by Supplier Chart
    this.salesChartOptions = {
      series: [{ name: 'Ventas', data: [] }],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false }
      },
      colors: ['#4F46E5'],
      xaxis: { categories: [] },
      grid: { show: true, borderColor: '#e5e7eb', strokeDashArray: 4 }
    };

    // Delivery Frequency Chart
    this.deliveryChartOptions = {
      series: [{ name: 'Entregas', data: [] }],
      chart: {
        type: 'line',
        height: 320,
        toolbar: { show: false }
      },
      colors: ['#28C76F'],
      xaxis: { categories: [] },
      stroke: { curve: 'smooth', width: 3 },
      grid: { show: true, borderColor: '#e5e7eb', strokeDashArray: 4 }
    };

    // Rating Distribution Chart
    this.ratingChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 280,
        toolbar: { show: false }
      },
      colors: ['#FF9F43', '#4F46E5', '#28C76F'],
      labels: [],
      legend: { position: 'bottom' }
    };
  }

  /**
   * Update all charts with data
   */
  private updateCharts() {
    if (this.suppliers.length === 0) return;

    // Sales Chart
    const topSuppliers = this.suppliers.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
    this.salesChartOptions.xaxis.categories = topSuppliers.map(s => s.name);
    this.salesChartOptions.series = [{ name: 'Ventas', data: topSuppliers.map(s => s.totalSales) }];

    // Delivery Chart
    this.deliveryChartOptions.xaxis.categories = topSuppliers.map(s => s.name);
    this.deliveryChartOptions.series = [{ name: 'Entregas', data: topSuppliers.map(s => s.deliveryCount) }];

    // Rating Chart
    const ratingBuckets = {
      'Excelente (4.5+)': this.suppliers.filter(s => parseFloat(s.rating.toString()) >= 4.5).length,
      'Bueno (3.5-4.4)': this.suppliers.filter(s => {
        const r = parseFloat(s.rating.toString());
        return r >= 3.5 && r < 4.5;
      }).length,
      'Regular (<3.5)': this.suppliers.filter(s => parseFloat(s.rating.toString()) < 3.5).length
    };
    
    this.ratingChartOptions.labels = Object.keys(ratingBuckets);
    this.ratingChartOptions.series = Object.values(ratingBuckets);
  }
}
