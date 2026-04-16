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

interface Product {
  id: number;
  name: string;
  sku: string;
  sellingPrice: number;
  discountPercent: number;
  finalPrice: number;
  stock: number;
  supplier: string;
  category?: string;
}

@Component({
  selector: 'app-inventory-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzButtonModule, NzModalModule, NzSelectModule],
  templateUrl: './inventory-admin.component.html',
  styleUrl: './inventory-admin.component.css',
  providers: [NzMessageService]
})
export class InventoryAdminComponent implements OnInit {

  searchQuery = '';
  isCreateModalVisible = false;
  isEditMode = false;
  editingProductId: number | null = null;

  // Products DB
  products: Product[] = [];

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private message: NzMessageService
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.products = this.storageService.getProducts();
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('No tienes notificaciones pendientes.');
  }

  // Summary stats (matching mockup)
  totalSkus = 1248;
  criticalStock = 24;
  lowStock = 45;
  outOfStock = 12;

  // New/Edit Product Form
  newProduct = {
    name: '',
    sellingPrice: null as number | null,
    discountPercent: 0,
    initialStock: 0,
    supplier: '',
    skuCode: '',
    category: 'Abarrotes'
  };

  suppliers = ['Lácteos del Valle', 'Distribuidora Central', 'Importaciones Mediterráneas', 'Gourmet Latino'];
  categories = ['Lácteos', 'Granos', 'Aceites', 'Abarrotes', 'Limpieza', 'Bebidas'];

  // Pagination
  currentPage = 1;
  pageSize = 6;

  get filteredProducts() {
    if (!this.searchQuery.trim()) return this.products;
    const q = this.searchQuery.toLowerCase();
    return this.products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.sku.toLowerCase().includes(q) || 
      p.supplier.toLowerCase().includes(q)
    );
  }

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get pageNumbers() {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStockClass(stock: number): string {
    if (stock <= 10) return 'stock-critical';
    if (stock <= 30) return 'stock-low';
    return 'stock-good';
  }

  openCreateModal() {
    this.isEditMode = false;
    this.editingProductId = null;
    this.newProduct = { name: '', sellingPrice: null, discountPercent: 0, initialStock: 0, supplier: '', skuCode: '', category: 'Abarrotes' };
    this.isCreateModalVisible = true;
  }

  openEditModal(product: Product) {
    this.isEditMode = true;
    this.editingProductId = product.id;
    this.newProduct = {
      name: product.name,
      sellingPrice: product.sellingPrice,
      discountPercent: product.discountPercent,
      initialStock: product.stock,
      supplier: product.supplier,
      skuCode: product.sku,
      category: product.category || 'Abarrotes'
    };
    this.isCreateModalVisible = true;
  }

  closeCreateModal() {
    this.isCreateModalVisible = false;
  }

  saveProduct() {
    if (!this.newProduct.name || !this.newProduct.sellingPrice) {
      this.message.warning('Por favor completa los campos obligatorios');
      return;
    }

    const sellingPrice = Number(this.newProduct.sellingPrice);
    const disc = Number(this.newProduct.discountPercent);
    const finalPrice = sellingPrice * (1 - disc / 100);

    let newList = [...this.products];

    if (this.isEditMode && this.editingProductId !== null) {
      // Update Mode
      newList = newList.map(p => {
        if (p.id === this.editingProductId) {
          return {
            ...p,
            name: this.newProduct.name,
            sku: this.newProduct.skuCode,
            sellingPrice,
            discountPercent: disc,
            finalPrice,
            stock: Number(this.newProduct.initialStock),
            supplier: this.newProduct.supplier,
            category: this.newProduct.category
          };
        }
        return p;
      });
      this.message.success('Producto actualizado con éxito');
    } else {
      // Create Mode
      newList.unshift({
        id: this.products.length + 1,
        name: this.newProduct.name,
        sku: this.newProduct.skuCode || ('ML-' + Math.floor(10000 + Math.random() * 90000)),
        sellingPrice,
        discountPercent: disc,
        finalPrice,
        stock: Number(this.newProduct.initialStock),
        supplier: this.newProduct.supplier,
        category: this.newProduct.category
      });
      this.message.success('Producto creado con éxito');
    }

    this.storageService.saveProducts(newList);
    this.loadProducts();
    this.closeCreateModal();
  }

  deleteProduct(product: Product) {
    const newList = this.products.filter(p => p.id !== product.id);
    this.storageService.saveProducts(newList);
    this.loadProducts();
    this.message.warning('Producto eliminado');
  }
}
