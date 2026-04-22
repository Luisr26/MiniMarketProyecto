import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NgApexchartsModule } from 'ng-apexcharts';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Bodeguero' | 'Cajero';
  status: 'Activo' | 'Inactivo';
  lastLogin: string;
  avatar?: string;
}

@Component({
  selector: 'app-users-manage',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzIconModule, 
    NzInputModule, 
    NzButtonModule, 
    NzSelectModule, 
    NzModalModule, 
    NgApexchartsModule,
    NzFormModule,
    NzGridModule
  ],
  templateUrl: './users-manage.component.html',
  styleUrl: './users-manage.component.css',
  providers: [NzMessageService, NzModalService]
})
export class UsersManageComponent implements OnInit {
  searchQuery = '';
  isDrawerVisible = false;
  isEditMode = false;
  editingUserId: number | null = null;

  totalUsers = 0;
  activeNow = 0;
  pendingUsers = 2;

  chartOptions: any;

  newUser = {
    fullName: '',
    email: '',
    role: 'Seleccionar...',
    status: 'Activo' as 'Activo' | 'Inactivo',
    password: ''
  };

  roles = ['Admin', 'Bodeguero', 'Cajero'];
  statuses = ['Activo', 'Inactivo'];

  users: User[] = [];

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private apiService: ApiService,
    private message: NzMessageService,
    private modalService: NzModalService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.users = this.storageService.getUsers();
    this.totalUsers = this.users.length;
    this.activeNow = this.users.filter(u => u.status === 'Activo').length;
    this.initChart();
  }

  initChart() {
    const adminCount = this.users.filter(u => u.role === 'Admin').length;
    const bodegueroCount = this.users.filter(u => u.role === 'Bodeguero').length;
    const cajeroCount = this.users.filter(u => u.role === 'Cajero').length;

    this.chartOptions = {
      series: [adminCount, bodegueroCount, cajeroCount],
      chart: { type: 'donut', height: 200 },
      labels: ['Admin', 'Bodeguero', 'Cajero'],
      colors: ['#10165F', '#4F46E5', '#10B981'],
      legend: { position: 'bottom' },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '65%' } } }
    };
  }

  get filteredUsers(): User[] {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  openCreateDrawer() {
    this.isEditMode = false;
    this.editingUserId = null;
    this.newUser = { fullName: '', email: '', role: 'Seleccionar...', status: 'Activo', password: '' };
    this.isDrawerVisible = true;
  }

  openEditDrawer(user: User) {
    this.isEditMode = true;
    this.editingUserId = user.id;
    this.newUser = {
      fullName: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '' // Optional password reset usually
    };
    this.isDrawerVisible = true;
  }

  closeCreateDrawer() {
    this.isDrawerVisible = false;
  }

  saveUser() {
    if (!this.newUser.fullName.trim() || !this.newUser.email.trim()) {
      this.message.warning('Por favor completa los campos básicos.');
      return;
    }

    // Map Role to ID
    let role_id = 3; // Cajero
    if (this.newUser.role === 'Admin') role_id = 1;
    else if (this.newUser.role === 'Bodeguero') role_id = 2;

    const apiPayload = {
      nombre_completo: this.newUser.fullName,
      correo: this.newUser.email,
      contrasena: this.newUser.password || '123456',
      role_id: role_id
    };

    if (this.isEditMode && this.editingUserId !== null) {
      // Update Mode (API currently lacks a PUT /users/:id in documentation, but we'll try or use local fallback)
      this.message.info('Actualizando localmente (API en desarrollo)');
      this.localSave();
    } else {
      // Create Mode
      this.apiService.createUser(apiPayload).subscribe((res: any) => {
        if (res.success) {
          this.message.success('Usuario creado en el servidor');
          this.storageService.reloadFromApi();
        } else {
          this.message.warning('Error en servidor. Guardando localmente.');
          this.localSave();
        }
      });
    }

    this.closeCreateDrawer();
  }

  private localSave() {
    let newList = [...this.users];
    if (this.isEditMode && this.editingUserId !== null) {
      newList = newList.map(u => {
        if (u.id === this.editingUserId) {
          return {
            ...u,
            name: this.newUser.fullName,
            email: this.newUser.email,
            role: this.newUser.role as any,
            status: this.newUser.status as any
          };
        }
        return u;
      });
    } else {
      newList.unshift({
        id: this.users.length + 1,
        name: this.newUser.fullName,
        email: this.newUser.email,
        role: this.newUser.role as any,
        status: this.newUser.status as any,
        lastLogin: 'Nunca'
      });
    }
    this.storageService.saveUsers(newList);
  }

  confirmDelete(user: User) {
    this.modalService.confirm({
      nzTitle: '¿Eliminar este usuario?',
      nzContent: `<b style="color: red;">${user.name}</b> perderá el acceso al sistema de forma inmediata.`,
      nzOkText: 'Eliminar Usuario',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteUser(user.id),
      nzCancelText: 'Cancelar'
    });
  }

  deleteUser(id: number) {
    this.apiService.deleteUser(id).subscribe((res: any) => {
      if (res.success) {
        this.message.success('Usuario eliminado del servidor');
        this.storageService.reloadFromApi();
      } else {
        this.message.warning('Eliminado localmente');
        const newList = this.users.filter(u => u.id !== id);
        this.storageService.saveUsers(newList);
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('Actualizaciones de perfiles procesadas.');
  }
}
