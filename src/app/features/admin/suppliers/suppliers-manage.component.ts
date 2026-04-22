import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';

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
  imports: [
    CommonModule, 
    FormsModule, 
    NzIconModule, 
    NzInputModule, 
    NzButtonModule, 
    NzModalModule, 
    NzSelectModule,
    NzFormModule,
    NzGridModule
  ],
  templateUrl: './suppliers-manage.component.html',
  styleUrl: './suppliers-manage.component.css',
  providers: [NzMessageService, NzModalService]
})
export class SuppliersManageComponent implements OnInit {
  searchQuery = '';
  isCreateModalVisible = false;
  isEditMode = false;
  editingSupplierId: number | null = null;

  activeSuppliersCount = 0;
  totalSkus = 0;
  pendingOrdersTotal = 5;

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
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliers = this.storageService.getSuppliers();
    this.activeSuppliersCount = this.suppliers.length;
    this.totalSkus = this.suppliers.reduce((sum, s) => sum + (s.skus || 0), 0);
  }

  get filteredSuppliers(): Supplier[] {
    let result = this.suppliers;
    const q = this.searchQuery.toLowerCase();

    if (q) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
      );
    }

    return result;
  }

  exportToPdf() {
    this.message.loading('Generando PDF...', { nzDuration: 1500 });
    setTimeout(() => {
      this.message.success('Reporte de proveedores exportado correctamente');
    }, 1600);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.editingSupplierId = null;
    this.newSupplier = { name: '', rut: '', phone: '', email: '', category: '', address: '' };
    this.isCreateModalVisible = true;
  }

  openEditModal(supplier: Supplier) {
    this.isEditMode = true;
    this.editingSupplierId = supplier.id;
    this.newSupplier = {
      name: supplier.name,
      rut: '',
      phone: supplier.phone,
      email: supplier.email,
      category: '',
      address: ''
    };
    this.isCreateModalVisible = true;
  }

  closeCreateModal() {
    this.isCreateModalVisible = false;
  }

  saveSupplier() {
    if (!this.newSupplier.name.trim()) return;

    let newList = [...this.suppliers];

    if (this.isEditMode && this.editingSupplierId !== null) {
      newList = newList.map(s => {
        if (s.id === this.editingSupplierId) {
          return {
            ...s,
            name: this.newSupplier.name,
            email: this.newSupplier.email,
            phone: this.newSupplier.phone
          };
        }
        return s;
      });
      this.message.success('Proveedor actualizado con éxito');
    } else {
      const initials = this.newSupplier.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      newList.unshift({
        id: this.suppliers.length + 1,
        name: this.newSupplier.name,
        email: this.newSupplier.email,
        phone: this.newSupplier.phone,
        skus: 0,
        registrationDate: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        initials: initials,
        color: '#E0E7FF'
      });
      this.message.success('Proveedor registrado con éxito');
    }

    this.storageService.saveSuppliers(newList);
    this.loadSuppliers();
    this.closeCreateModal();
  }

  confirmDelete(supplier: Supplier) {
    this.modal.confirm({
      nzTitle: '¿Eliminar proveedor?',
      nzContent: `<b style="color: red;">${supplier.name}</b> será removido de la lista de proveedores.`,
      nzOkText: 'Sí, eliminar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSupplier(supplier.id),
      nzCancelText: 'Cancelar'
    });
  }

  deleteSupplier(id: number) {
    const newList = this.suppliers.filter(s => s.id !== id);
    this.storageService.saveSuppliers(newList);
    this.loadSuppliers();
    this.message.warning('Proveedor eliminado');
  }

  logout() {
    this.authService.logout();
  }
}
