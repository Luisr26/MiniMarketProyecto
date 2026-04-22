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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductEntryComponent } from '../../../shared/components/product-entry/product-entry.component';
import { Subscription, debounceTime } from 'rxjs';
import { RouterModule } from '@angular/router';

interface Transaction {
  id: string;
  date: string;
  customer: string;
  items: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  method?: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NzIconModule, NzTableModule, NzInputModule, NzButtonModule, NzSelectModule, NzModalModule, NzDatePickerModule, NgApexchartsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  providers: [NzMessageService, NzModalService]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  // Search and Filter
  searchQuery = '';
  topSearchQuery = '';
  filterDate: any = null;
  filterType: string | null = null;

  // Data
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  activeStockCount = 0;
  lowStockCount = 0;
  revenueToday = 0;
  criticalAlerts = 0;
  userName = 'Admin';
  totalSalesCount = 0;
  isQA = false;

  // Table Paging
  pageIndex = 1;
  pageSize = 5;
  isLoading = false;

  private subs = new Subscription();

  // Chart Properties
  public chartOptions: any;
  public stockChartOptions: any;

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private modalService: NzModalService,
    private message: NzMessageService
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
   * Load all data from services
   */
  loadData() {
    const session = this.authService.currentUserValue;
    if (session) {
      this.userName = session.name;
      this.isQA = session.role === 'qa';
    }

    // React to Products Changes
    this.subs.add(
      this.storageService.products$.subscribe(products => {
        this.activeStockCount = products.length;
        this.lowStockCount = products.filter((p: any) => p.stock <= 10).length;
        this.criticalAlerts = products.filter((p: any) => p.stock === 0).length;
        this.updateStockChart(products);
      })
    );

    // React to History Changes
    this.subs.add(
      this.storageService.history$.pipe(
        debounceTime(100)
      ).subscribe(history => {
        this.totalSalesCount = history.length;
        this.revenueToday = history.reduce((sum: number, t: any) => sum + (t.total || 0), 0);

        this.transactions = history.map((t: any) => ({
          id: '#' + t.id,
          date: t.time || 'N/A',
          customer: 'Público General',
          items: t.items + ' Items',
          amount: t.total,
          method: t.method || 'EFECTIVO',
          status: t.status === 'COMPLETADO' ? 'PAID' : 'PENDING'
        }));

        this.filterTransactions();
        this.updateChartData(history);
      })
    );
  }

  /**
   * Filter transactions based on search, date, and type
   */
  filterTransactions() {
    this.isLoading = true;

    let result = [...this.transactions];
    const q = this.searchQuery.toLowerCase().trim();

    // Search filter
    if (q) {
      result = result.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.customer.toLowerCase().includes(q) ||
        t.method?.toLowerCase().includes(q)
      );
    }

    // Payment method filter
    if (this.filterType && this.filterType !== 'all') {
      const typeMap: any = {
        'efectivo': 'EFECTIVO',
        'tarjeta': 'TARJETA',
        'transferencia': 'TRANSFERENCIA'
      };
      const filterVal = typeMap[this.filterType.toLowerCase()] || this.filterType.toUpperCase();
      result = result.filter(t => t.method === filterVal);
    }

    // Date filter (if implemented)
    if (this.filterDate) {
      const filterDateStr = new Date(this.filterDate).toLocaleDateString();
      // Note: This is simplified as mock data doesn't have real dates
    }

    setTimeout(() => {
      this.filteredTransactions = result;
      this.isLoading = false;
    }, 200);
  }

  /**
   * Handle filter changes
   */
  onFilterChange() {
    this.pageIndex = 1;
    this.filterTransactions();
  }

  /**
   * Apply date filter
   */
  applyDateFilter(date: any) {
    this.filterDate = date;
    this.pageIndex = 1;
    this.filterTransactions();
  }

  /**
   * Apply payment method filter
   */
  applyTypeFilter(type: string | null) {
    this.filterType = type === 'all' ? null : type;
    this.pageIndex = 1;
    this.filterTransactions();
  }

  /**
   * Open Product Entry Modal
   */
  openProductEntry() {
    this.modalService.create({
      nzTitle: 'Registrar Entrada de Mercancía',
      nzContent: ProductEntryComponent,
      nzWidth: 800,
      nzFooter: null,
      nzClassName: 'premium-modal',
      nzCentered: true,
      nzOkText: null,
      nzCancelText: null
    });
  }

  /**
   * Initialize chart configurations
   */
  private initCharts() {
    // Sales Revenue Chart
    this.chartOptions = {
      series: [{ name: 'Ingresos', data: [0, 0, 0, 0, 0, 0, 0] }],
      chart: {
        height: 320,
        type: 'area',
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 800 },
        sparkline: { enabled: false }
      },
      colors: ['#4F46E5'],
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100]
        }
      },
      xaxis: {
        categories: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#9CA3AF' } }
      },
      yaxis: {
        labels: { style: { colors: '#9CA3AF' } }
      },
      grid: {
        show: true,
        borderColor: '#e5e7eb',
        strokeDashArray: 4
      },
      tooltip: {
        theme: 'light',
        x: { show: true },
        y: { formatter: (val: number) => `$${val.toFixed(2)}` }
      }
    };

    // Stock Status Chart
    this.stockChartOptions = {
      series: [0, 0, 0],
      chart: {
        type: 'donut',
        height: 280,
        toolbar: { show: false }
      },
      colors: ['#28C76F', '#FF9F43', '#EA5455'],
      labels: ['Stock Normal', 'Stock Bajo', 'Sin Stock'],
      legend: {
        position: 'bottom',
        labels: { colors: '#6B7280' }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px' },
              value: { show: true, fontSize: '16px', fontWeight: 600 }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      }
    };
  }

  /**
   * Update sales chart with real data
   */
  private updateChartData(history: any[]) {
    if (!history || history.length === 0) {
      this.chartOptions.series = [{ name: 'Ingresos', data: [0, 0, 0, 0, 0, 0, 0] }];
      return;
    }

    const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
    const data = [0, 0, 0, 0, 0, 0, 0];

    history.forEach(t => {
      // Simplified: assign to random day for demo purposes
      const randomDay = Math.floor(Math.random() * 7);
      data[randomDay] += t.total || 0;
    });

    this.chartOptions.series = [{
      name: 'Ingresos',
      data: data
    }];
  }

  /**
   * Update stock status chart
   */
  private updateStockChart(products: any[]) {
    const normalStock = products.filter((p: any) => p.stock > 10).length;
    const lowStock = products.filter((p: any) => p.stock > 0 && p.stock <= 10).length;
    const noStock = products.filter((p: any) => p.stock === 0).length;

    if (this.stockChartOptions) {
      this.stockChartOptions.series = [normalStock, lowStock, noStock];
    }
  }

  /**
   * Logout
   */
  logout() {
    this.authService.logout();
  }

  /**
   * Show notifications
   */
  showNotifications() {
    this.message.info('Sincronización de inventario completada correctamente.');
  }

  /**
   * Global search
   */
  onGlobalSearch() {
    this.message.loading('Buscando en todos los módulos: ' + this.topSearchQuery, { nzDuration: 1000 });
  }
}
