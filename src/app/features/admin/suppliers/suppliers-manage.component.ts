import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone: string;
  skus: number;
  registrationDate: string;
  initials: string;
  color: string;
}

@Component({
  selector: 'app-suppliers-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzButtonModule, NzModalModule, NzSelectModule],
  templateUrl: './suppliers-manage.component.html',
  styleUrl: './suppliers-manage.component.css',
  providers: [NzMessageService]
})
export class SuppliersManageComponent implements OnInit {
  searchQuery = '';
  isCreateModalVisible = false;

  // Stats
  activeSuppliersCount = 0;
  pendingOrdersTotal = '$12,450.00';
  newOrdersCount = 5;

  // New Supplier Form
  newSupplier = {
     name: '',
     rut: '',
     phone: '',
     email: '',
     category: '',
     address: ''
  };

  categories = ['Alimentos y Bebidas', 'Limpieza', 'Cuidado Personal', 'Lácteos', 'Otros'];
  suppliers: Supplier[] = [];

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliers = this.storageService.getSuppliers();
    this.activeSuppliersCount = this.suppliers.length;
  }

  get filteredSuppliers(): Supplier[] {
    if (!this.searchQuery.trim()) return this.suppliers;
    const q = this.searchQuery.toLowerCase();
    return this.suppliers.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q)
    );
  }

  openCreateModal() {
    this.newSupplier = { name: '', rut: '', phone: '', email: '', category: '', address: '' };
    this.isCreateModalVisible = true;
  }

  closeCreateModal() {
    this.isCreateModalVisible = false;
  }

  saveSupplier() {
    if (!this.newSupplier.name.trim()) return;

    const initials = this.newSupplier.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const newList = [...this.suppliers];

    newList.unshift({
      id: this.suppliers.length + 1,
      name: this.newSupplier.name,
      email: this.newSupplier.email,
      phone: this.newSupplier.phone,
      skus: 0,
      registrationDate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      initials: initials,
      color: '#E5E7EB'
    });

    this.storageService.saveSuppliers(newList);
    this.loadSuppliers();
    this.closeCreateModal();
    this.message.success('Proveedor registrado con éxito');
  }

  deleteSupplier(id: number) {
    const newList = this.suppliers.filter(s => s.id !== id);
    this.storageService.saveSuppliers(newList);
    this.loadSuppliers();
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('No tienes notificaciones de pedidos pendientes.');
  }
}
