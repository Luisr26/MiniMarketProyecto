import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { StorageService } from '../../../core/services/storage.service';

@Component({
  selector: 'app-product-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzSelectModule],
  templateUrl: './product-entry.component.html',
  styleUrl: './product-entry.component.css',
  providers: [NzMessageService]
})
export class ProductEntryComponent implements OnInit {
  
  products: any[] = [];
  selectedProductId: number | null = null;
  entryQuantity: number | null = null;
  entryNote: string = '';

  recentEntries: any[] = [
    { id: 101, product: 'Arroz Premium 1kg', qty: 50, date: '15/04/2026', user: 'Elena G.' },
    { id: 102, product: 'Leche Entera 1L', qty: 24, date: '15/04/2026', user: 'Elena G.' }
  ];

  constructor(
    private storageService: StorageService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.products = this.storageService.getProducts();
  }

  registerEntry() {
    if (!this.selectedProductId || !this.entryQuantity || this.entryQuantity <= 0) {
      this.message.warning('Por favor completa todos los campos correctamente.');
      return;
    }

    const allProducts = this.storageService.getProducts();
    const productIndex = allProducts.findIndex(p => p.id === this.selectedProductId);

    if (productIndex !== -1) {
      allProducts[productIndex].stock += Number(this.entryQuantity);
      this.storageService.saveProducts(allProducts);
      
      this.recentEntries.unshift({
        id: Math.floor(100 + Math.random() * 900),
        product: allProducts[productIndex].name,
        qty: this.entryQuantity,
        date: new Date().toLocaleDateString(),
        user: 'Usuario'
      });

      this.message.success(`Se agregaron ${this.entryQuantity} unidades a ${allProducts[productIndex].name}`);
      this.resetForm();
    }
  }

  resetForm() {
    this.selectedProductId = null;
    this.entryQuantity = null;
    this.entryNote = '';
  }
}
