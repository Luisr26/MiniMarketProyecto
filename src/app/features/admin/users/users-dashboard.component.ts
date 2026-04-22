import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../../core/services/storage.service';
import { Subscription, debounceTime } from 'rxjs';

interface UserCard {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'bodeguero' | 'vendedor';
  status: 'Activo' | 'Inactivo';
  lastLogin: string;
  loginCount: number;
  joinDate: string;
  activityScore: number;
}

@Component({
  selector: 'app-users-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzButtonModule, NzInputModule, NzSelectModule, NzModalModule, NgApexchartsModule],
  templateUrl: './users-dashboard.component.html',
  styleUrl: './users-dashboard.component.css',
  providers: [NzMessageService, NzModalService]
})
export class UsersDashboardComponent implements OnInit, OnDestroy {
  
  // Data
  users: UserCard[] = [];
  filteredUsers: UserCard[] = [];
  
  // Filters
  searchQuery = '';
  filterRole: string | null = null;
  filterStatus: string | null = null;
  
  // View
  viewMode: 'cards' | 'table' = 'cards';
  isLoading = false;
  
  // Stats
  totalUsers = 0;
  activeUsers = 0;
  newUsersThisMonth = 0;
  
  // Activity Chart
  activityChartOptions: any;
  
  private subs = new Subscription();

  constructor(
    private storageService: StorageService,
    private message: NzMessageService,
    private modalService: NzModalService
  ) {
    this.initChart();
  }

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  /**
   * Load users data
   */
  private loadUsers() {
    this.subs.add(
      this.storageService.users$.pipe(
        debounceTime(100)
      ).subscribe(storedUsers => {
        this.users = storedUsers.map((u: any, index: number) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: ['admin', 'bodeguero', 'vendedor'][index % 3] as any,
          status: index % 4 === 0 ? 'Inactivo' : 'Activo',
          lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          loginCount: Math.floor(Math.random() * 150) + 5,
          joinDate: u.joinDate,
          activityScore: Math.floor(Math.random() * 100)
        }));
        
        this.updateStats();
        this.filterUsers();
        this.updateActivityChart();
      })
    );
  }

  /**
   * Update statistics
   */
  private updateStats() {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.status === 'Activo').length;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    this.newUsersThisMonth = this.users.filter(u => new Date(u.joinDate) > oneMonthAgo).length;
  }

  /**
   * Filter users
   */
  private filterUsers() {
    this.isLoading = true;
    
    let result = [...this.users];
    const q = this.searchQuery.toLowerCase().trim();
    
    // Search
    if (q) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    
    // Role filter
    if (this.filterRole && this.filterRole !== 'all') {
      result = result.filter(u => u.role === this.filterRole);
    }
    
    // Status filter
    if (this.filterStatus && this.filterStatus !== 'all') {
      result = result.filter(u => u.status === this.filterStatus);
    }
    
    setTimeout(() => {
      this.filteredUsers = result;
      this.isLoading = false;
    }, 200);
  }

  /**
   * Handle filter changes
   */
  onFilterChange() {
    this.filterUsers();
  }

  /**
   * Get role label
   */
  getRoleLabel(role: string): string {
    const roles: { [key: string]: string } = {
      'admin': 'Administrador',
      'bodeguero': 'Bodeguero',
      'vendedor': 'Vendedor'
    };
    return roles[role] || role;
  }

  /**
   * Get role badge color
   */
  getRoleBadgeClass(role: string): string {
    const colors: { [key: string]: string } = {
      'admin': 'role-admin',
      'bodeguero': 'role-bodeguero',
      'vendedor': 'role-vendedor'
    };
    return colors[role] || '';
  }

  /**
   * Create new user
   */
  createNewUser() {
    this.message.info('Función de crear usuario en desarrollo');
  }

  /**
   * Edit user
   */
  editUser(user: UserCard) {
    this.message.info(`Editando usuario: ${user.name}`);
  }

  /**
   * Delete user
   */
  deleteUser(user: UserCard) {
    this.modalService.confirm({
      nzTitle: 'Eliminar usuario',
      nzContent: `¿Está seguro que desea eliminar a ${user.name}?`,
      nzOkText: 'Sí, eliminar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Cancelar',
      nzOnOk: () => {
        this.message.success('Usuario eliminado correctamente');
      }
    });
  }

  /**
   * Switch view mode
   */
  switchViewMode(mode: 'cards' | 'table') {
    this.viewMode = mode;
  }

  /**
   * Initialize activity chart
   */
  private initChart() {
    this.activityChartOptions = {
      series: [{
        name: 'Logins',
        data: []
      }],
      chart: {
        type: 'area',
        height: 300,
        toolbar: { show: false },
        sparkline: { enabled: false }
      },
      colors: ['#4F46E5'],
      xaxis: { categories: [] },
      yaxis: { show: true },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.1 } },
      grid: { show: true, borderColor: '#e5e7eb', strokeDashArray: 4 }
    };
  }

  /**
   * Update activity chart
   */
  private updateActivityChart() {
    if (this.users.length === 0) return;
    
    const topUsers = this.users.sort((a, b) => b.loginCount - a.loginCount).slice(0, 8);
    this.activityChartOptions.xaxis.categories = topUsers.map(u => u.name.split(' ')[0]);
    this.activityChartOptions.series = [{ name: 'Logins', data: topUsers.map(u => u.loginCount) }];
  }
}
