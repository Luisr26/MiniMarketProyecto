import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { ApiService } from '../../../core/services/api.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { Subscription } from 'rxjs';

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
  templateUrl: './inventory-admin.component.html',
  styleUrl: './inventory-admin.component.css',
  providers: [NzMessageService, NzModalService]
})
export class InventoryAdminComponent implements OnInit, OnDestroy {

  searchQuery = '';
  statusFilter = 'Todos';
  categoryFilter = 'Todas';

  isCreateModalVisible = false;
  isEditMode = false;
  editingProductId: number | null = null;

  // Products DB
  products: Product[] = [];
  
  private subs = new Subscription();

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private apiService: ApiService,
    private modal: NzModalService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  loadProducts() {
    this.subs.add(this.storageService.products$.subscribe(data => {
      this.products = data;
      this.updateStats();
      this.cdr.detectChanges();
    }));
  }

  updateStats() {
    this.totalSkus = this.products.length;
    this.criticalStock = this.products.filter(p => p.stock === 0).length;
    this.lowStock = this.products.filter(p => p.stock > 0 && p.stock <= 10).length;
    this.outOfStock = this.products.filter(p => p.stock === 0).length;
  }

  logout() {
    this.authService.logout();
  }

  showNotifications() {
    this.message.info('No tienes notificaciones pendientes.');
  }

  // Summary stats
  totalSkus = 0;
  criticalStock = 0;
  lowStock = 0;
  outOfStock = 0;

  // New/Edit Product Form
  newProduct = {
    name: '',
    sellingPrice: null as number | null,
    discountPercent: 0,
    initialStock: 0,
    supplier: '',
    skuCode: '',
    category: 'Abarrotes',
    imageUrl: ''
  };

  suppliers = ['Lácteos del Valle', 'Distribuidora Central', 'Importaciones Mediterráneas', 'Gourmet Latino'];
  categories = ['Lácteos', 'Granos', 'Aceites', 'Abarrotes', 'Limpieza', 'Bebidas'];

  // Pagination
  currentPage = 1;
  pageSize = 6;

  get filteredProducts() {
    let list = [...this.products];

    // Search Query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.supplier.toLowerCase().includes(q)
      );
    }

    // Category Filter
    if (this.categoryFilter !== 'Todas') {
      list = list.filter(p => p.category === this.categoryFilter);
    }

    // Status Filter
    if (this.statusFilter === 'Crítico') {
      list = list.filter(p => p.stock <= 10);
    } else if (this.statusFilter === 'Agotado') {
      list = list.filter(p => p.stock === 0);
    } else if (this.statusFilter === 'Buen Stock') {
      list = list.filter(p => p.stock > 30);
    }

    return list;
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
    this.newProduct = { name: '', sellingPrice: null, discountPercent: 0, initialStock: 0, supplier: '', skuCode: '', category: 'Abarrotes', imageUrl: '' };
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
      category: product.category || 'Abarrotes',
      imageUrl: (product as any).image || ''
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

    // Prepare API payload (Matched to documentation)
    const apiPayload = {
      nombre: this.newProduct.name,
      sku: this.newProduct.skuCode || ('ML-' + Math.floor(10000 + Math.random() * 90000)),
      precio_venta: sellingPrice,
      stock_minimo: 10, // Default as per documentation example
      categoria_id: 1,
      proveedor_id: 1
    };

    if (this.isEditMode && this.editingProductId !== null) {
      this.apiService.updateProduct(this.editingProductId, apiPayload).subscribe((res: any) => {
        if (res.success) {
          this.message.success('Producto actualizado en el servidor');
          this.storageService.reloadFromApi();
        } else {
          this.message.warning('Actualización fallida (Modo Local)');
          this.localSave(sellingPrice, disc, finalPrice);
        }
      });
    } else {
      this.apiService.createProduct(apiPayload).subscribe((res: any) => {
        if (res.success) {
          this.message.success('Producto creado en el servidor');
          this.storageService.reloadFromApi();
        } else {
          this.message.warning('Creación fallida (Modo Local)');
          this.localSave(sellingPrice, disc, finalPrice);
        }
      });
    }

    this.closeCreateModal();
  }

  private localSave(sellingPrice: number, disc: number, finalPrice: number) {
    let newList = [...this.products];
    if (this.isEditMode && this.editingProductId !== null) {
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
            category: this.newProduct.category,
            image: this.newProduct.imageUrl
          };
        }
        return p;
      });
    } else {
      newList.unshift({
        id: this.products.length + 1,
        name: this.newProduct.name,
        sku: this.newProduct.skuCode || ('ML-' + Math.floor(10000 + Math.random() * 90000)),
        sellingPrice,
        discountPercent: disc,
        finalPrice,
        stock: Number(this.newProduct.initialStock),
        supplier: this.newProduct.supplier,
        category: this.newProduct.category,
        image: this.newProduct.imageUrl
      } as any);
    }
    this.storageService.saveProducts(newList);
  }

  confirmDelete(product: Product) {
    this.modal.confirm({
      nzTitle: '¿Estás seguro de eliminar este producto?',
      nzContent: `<b style="color: red;">${product.name}</b> será eliminado permanentemente del inventario.`,
      nzOkText: 'Eliminar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteProduct(product),
      nzCancelText: 'Cancelar'
    });
  }

  deleteProduct(product: Product) {
    this.apiService.deleteProduct(product.id).subscribe((res: any) => {
      if (res.success) {
        this.message.success('Producto eliminado del servidor');
        this.storageService.reloadFromApi();
      } else {
        this.message.warning('Eliminado localmente');
        const newList = this.products.filter(p => p.id !== product.id);
        this.storageService.saveProducts(newList);
      }
    });
  }
}
