import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-product-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzSelectModule, NzInputModule, NzDatePickerModule],
  templateUrl: './product-entry.component.html',
  styleUrl: './product-entry.component.css',
  providers: [NzMessageService]
})
export class ProductEntryComponent implements OnInit {
  products: any[] = [];
  suppliers: any[] = [];
  
  formData = {
    productId: null,
    supplierId: null,
    quantity: 1,
    entryDate: new Date(),
    notes: ''
  };

  recentEntries: any[] = [
    { id: '#ENT-001', product: 'Leche Entera 1L', quantity: 48, supplier: 'Lácteos del Valle', time: 'Hace 2 horas', status: 'COMPLETADO' },
    { id: '#ENT-002', product: 'Arroz Premium 1kg', quantity: 100, supplier: 'Distribuidora Central', time: 'Ayer, 10:20 AM', status: 'COMPLETADO' }
  ];

  constructor(
    private storageService: StorageService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.products = this.storageService.getProducts();
    this.suppliers = this.storageService.getSuppliers();
  }

  submitEntry() {
    if (!this.formData.productId || !this.formData.quantity) {
      this.message.error('Por favor complete todos los campos obligatorios.');
      return;
    }

    const products = this.storageService.getProducts();
    const productIndex = products.findIndex((p: any) => p.id === this.formData.productId);

    if (productIndex > -1) {
      // Update stock
      products[productIndex].stock += this.formData.quantity;
      this.storageService.saveProducts(products);

      // Add to recent activity simulation
      const productName = products[productIndex].name;
      const supplierName = this.suppliers.find((s: any) => s.id === this.formData.supplierId)?.name || 'Proveedor Genérico';
      
      this.recentEntries.unshift({
        id: '#ENT-' + Math.floor(Math.random() * 900 + 100),
        product: productName,
        quantity: this.formData.quantity,
        supplier: supplierName,
        time: 'Justo ahora',
        status: 'COMPLETADO'
      });

      this.message.success(`Registro exitoso: +${this.formData.quantity} unidades de ${productName}`);
      this.resetForm();
    }
  }

  resetForm() {
    this.formData = {
      productId: null,
      supplierId: null,
      quantity: 1,
      entryDate: new Date(),
      notes: ''
    };
  }
}
