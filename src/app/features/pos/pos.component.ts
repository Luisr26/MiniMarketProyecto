import { Component, AfterViewChecked, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import JsBarcode from 'jsbarcode';
import { StorageService } from '../../core/services/storage.service';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Subscription, debounceTime, Subject } from 'rxjs';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  discountRate?: number;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';

import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzIconModule, 
    NzInputModule, 
    NzButtonModule, 
    NzModalModule, 
    NzSelectModule,
    NzGridModule,
    NzFormModule,
    NzCheckboxModule
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css',
  providers: [NzModalService, NzMessageService]
})
export class PosComponent implements OnInit, OnDestroy, AfterViewChecked {
  
  @ViewChild('barcodeElement') barcodeElement!: ElementRef;

  // Real User from Session
  cashierName = 'Invitado';
  terminalId = 'Terminal 01';

  // Products DB
  products: Product[] = [];
  categories = ['Todos', 'Bebidas', 'Lácteos', 'Panadería', 'Abarrotes', 'Snacks', 'Granos', 'Aceites'];
  activeCategory = 'Todos';

  // Cart State
  cart: CartItem[] = [];

  // Modal State
  isPaymentModalVisible = false;
  paymentMethod: 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' = 'EFECTIVO';
  receivedAmount: number | null = null;
  printReceipt = true;

  // Final Success State
  isSaleCompleted = false;
  transactionId = '';
  transactionDate = '';
  isCategoriesExpanded = false;

  // Filter
  searchQuery = '';
  private searchSubject = new Subject<string>();

  private subs = new Subscription();

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private apiService: ApiService,
    private message: NzMessageService,
    private modalService: NzModalService
  ) {}

  ngOnInit() {
    this.loadInitialData();

    // Setup debounced search
    this.subs.add(
      this.searchSubject.pipe(
        debounceTime(300)
      ).subscribe(() => {
        // Filter will be applied via getter
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.searchSubject.complete();
  }

  /**
   * Load initial data
   */
  loadInitialData() {
    const session = this.authService.currentUserValue;
    if (session) {
      this.cashierName = session.name;
    }

    // Subscribe to reactive products stream (already handles API + local)
    this.subs.add(this.storageService.products$.subscribe(stored => {
      this.products = stored.map((p: any) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category || 'Abarrotes',
        price: p.finalPrice || p.sellingPrice || 0,
        stock: p.stock ?? 0,
        discountRate: (p.discountPercent || 0) / 100,
        image: p.image || ''
      }));

      // AUTO-SEED if database is empty (User requirement)
      if (this.products.length === 0 && this.authService.currentUserValue?.role === 'qa') {
        console.log('Database empty, auto-seeding...');
        // We trigger the seed from main layout or just wait for next sync
      }
    }));
  }

  /**
   * Get filtered products based on category and search query
   */
  get filteredProducts() {
    return this.products.filter(p => {
      const matchCat = this.activeCategory === 'Todos' || p.category === this.activeCategory;
      const matchSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStock = p.stock > 0;
      return matchCat && matchSearch && matchStock;
    });
  }

  /**
   * Set active category
   */
  setCategory(cat: string) {
    this.activeCategory = cat;
  }

  /**
   * Handle search query changes with debounce
   */
  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  toggleCategories() {
    this.isCategoriesExpanded = !this.isCategoriesExpanded;
  }

  // ==================== CART LOGIC ====================

  /**
   * Add product to cart
   */
  addToCart(product: Product) {
    if (product.stock <= 0) {
      this.message.warning('Producto sin stock disponible');
      return;
    }
    
    const existing = this.cart.find(c => c.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
        this.message.create('success', `${product.name} agregado al carrito`);
      } else {
        this.message.warning(`Stock máximo de ${product.name} alcanzado`);
      }
    } else {
      this.cart.push({ ...product, quantity: 1 });
      this.message.create('success', `${product.name} agregado al carrito`);
    }
  }

  /**
   * Increment quantity
   */
  incrementQty(item: CartItem) {
    const p = this.products.find(prod => prod.id === item.id);
    if (p && item.quantity < p.stock) {
      item.quantity++;
    } else {
      this.message.warning('Stock máximo alcanzado');
    }
  }

  /**
   * Decrement quantity or remove item
   */
  decrementQty(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.removeFromCart(item);
    }
  }

  /**
   * Remove item from cart with confirmation
   */
  removeFromCart(item: CartItem) {
    this.modalService.confirm({
      nzTitle: 'Remover del carrito',
      nzContent: `¿Remover ${item.name} del carrito?`,
      nzOkText: 'Sí, remover',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.cart = this.cart.filter(c => c.id !== item.id);
        this.message.success(`${item.name} removido del carrito`);
      }
    });
  }

  /**
   * Clear cart with confirmation
   */
  clearCart() {
    if (this.cart.length === 0) return;

    this.modalService.confirm({
      nzTitle: 'Limpiar carrito',
      nzContent: '¿Está seguro que desea vaciar el carrito? Se perderán todos los artículos.',
      nzOkText: 'Sí, vaciar',
      nzCancelText: 'Cancelar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.cart = [];
        this.message.success('Carrito vaciado');
      }
    });
  }

  /**
   * Calculate total items
   */
  get totalItems() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Calculate subtotal
   */
  get subtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Calculate total discount
   */
  get discountTotal() {
    return this.cart.reduce((sum, item) => {
      if (item.discountRate) {
        return sum + (item.price * item.quantity * item.discountRate);
      }
      return sum;
    }, 0);
  }

  /**
   * Calculate IVA (16%)
   */
  get ivaTotal() {
    return (this.subtotal - this.discountTotal) * 0.16;
  }

  /**
   * Calculate final total
   */
  get finalTotal() {
    return (this.subtotal - this.discountTotal) + this.ivaTotal;
  }

  // ==================== PAYMENT MODAL LOGIC ====================

  /**
   * Open payment modal
   */
  openPaymentModal() {
    if (this.cart.length === 0) {
      this.message.warning('El carrito está vacío');
      return;
    }
    
    this.receivedAmount = Number(this.finalTotal.toFixed(2));
    this.isPaymentModalVisible = true;
    this.transactionId = '#F-2024-' + Math.floor(1000 + Math.random() * 9000);
  }

  /**
   * Close payment modal
   */
  closePaymentModal() {
    this.isPaymentModalVisible = false;
  }

  /**
   * Calculate change returned
   */
  get changeReturned() {
    if (this.receivedAmount && this.receivedAmount >= this.finalTotal) {
      return this.receivedAmount - this.finalTotal;
    }
    return 0;
  }

  /**
   * Validate payment
   */
  get isPaymentValid() {
    return this.receivedAmount !== null && this.receivedAmount >= this.finalTotal;
  }

  /**
   * Confirm sale - directly processes the sale and navigates to the invoice
   * The payment modal already serves as the confirmation step
   */
  confirmSale() {
    if (!this.isPaymentValid) {
      this.message.error('El monto recibido es insuficiente');
      return;
    }

    // Process sale directly - no extra confirmation needed
    this.processSale();
  }

  /**
   * Process the sale (after confirmation)
   */
  private processSale() {
    const now = new Date();
    this.transactionDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Prepare API payload
    const salePayload = {
      turno_id: 1, // Fixed for now
      metodo_pago: this.paymentMethod,
      descuento_total: Number(this.discountTotal.toFixed(2)),
      items: this.cart.map(item => ({
        producto_id: item.id,
        cantidad: item.quantity
      }))
    };

    // Call API
    this.apiService.createSale(salePayload).subscribe((res: any) => {
      if (res.success) {
        this.message.success('Venta registrada en el servidor');
        if (res.data?.id) {
          this.transactionId = '#F-' + res.data.id;
        }
      } else {
        this.message.warning('Venta guardada localmente (Modo Offline)');
      }
    });

    // Local state update (Always do this for instant UI feedback and offline support)
    const allStoredProducts = this.storageService.getProductsValue();
    this.cart.forEach(cItem => {
      const storedP = allStoredProducts.find((sp: any) => sp.id === cItem.id);
      if (storedP) storedP.stock -= cItem.quantity;
    });

    this.storageService.saveProducts(allStoredProducts);
    this.storageService.addHistoryEntry({
      id: this.transactionId.replace('#', ''),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      items: this.totalItems,
      method: this.paymentMethod === 'TRANSFERENCIA' ? 'TRANSFER' : this.paymentMethod,
      total: Number(this.finalTotal.toFixed(2)),
      status: 'COMPLETADO'
    });

    // Close modal and show invoice
    this.isPaymentModalVisible = false;
    this.isSaleCompleted = true;
    this.message.success('Venta completada exitosamente');
  }

  /**
   * Generate barcode after view checked
   */
  ngAfterViewChecked(): void {
    if (this.isSaleCompleted && this.barcodeElement) {
      this.generateBarcode();
    }
  }

  /**
   * Generate barcode
   */
  private generateBarcode() {
    const id = this.transactionId.replace('#', '');
    JsBarcode(this.barcodeElement.nativeElement, id, {
      format: 'CODE128',
      lineColor: '#10165F',
      width: 2,
      height: 40,
      displayValue: false
    });
  }

  /**
   * Start new sale
   */
  newSale() {
    this.cart = [];
    this.receivedAmount = null;
    this.isSaleCompleted = false;
  }
}
