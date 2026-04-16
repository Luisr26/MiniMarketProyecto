import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

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
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzButtonModule, NzSelectModule, NzDrawerModule],
  templateUrl: './users-manage.component.html',
  styleUrl: './users-manage.component.css',
  providers: [NzMessageService]
})
export class UsersManageComponent implements OnInit {
  searchQuery = '';
  isDrawerVisible = false;
  isEditMode = false;
  editingUserId: number | null = null;

  // Stats
  totalUsers = 0;
  activeNow = 0;
  pendingUsers = 2;

  // New/Edit User Form
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
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.users = this.storageService.getUsers();
    this.totalUsers = this.users.length;
    this.activeNow = this.users.filter(u => u.status === 'Activo').length;
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

    let newList = [...this.users];

    if (this.isEditMode && this.editingUserId !== null) {
      // Update Mode
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
      this.message.success('Usuario actualizado con éxito');
    } else {
      // Create Mode
      newList.unshift({
        id: this.users.length + 1,
        name: this.newUser.fullName,
        email: this.newUser.email,
        role: this.newUser.role as any,
        status: this.newUser.status as any,
        lastLogin: 'Nunca'
      });
      this.message.success('Usuario creado con éxito');
    }

    this.storageService.saveUsers(newList);
    this.loadUsers();
    this.closeCreateDrawer();
  }

  deleteUser(id: number) {
    const newList = this.users.filter(u => u.id !== id);
    this.storageService.saveUsers(newList);
    this.loadUsers();
    this.message.warning('Usuario eliminado');
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('Actualizaciones de perfiles procesadas.');
  }
}
