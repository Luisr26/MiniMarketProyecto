import { Component, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import JsBarcode from 'jsbarcode';
import { StorageService } from '../../core/services/storage.service';
import { AuthService } from '../../core/services/auth.service';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  discountRate?: number;
}

interface CartItem extends Product {
  quantity: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule, NzInputModule, NzButtonModule, NzModalModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.css'
})
export class PosComponent implements AfterViewChecked {
  
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

  // Filter
  searchQuery = '';

  constructor(
    private storageService: StorageService,
    private authService: AuthService
  ) {
    this.loadInitialData();
  }

  loadInitialData() {
    const session = this.authService.currentUserValue;
    if (session) {
      this.cashierName = session.name;
    }

    // Map Storage products to POS interface
    const stored = this.storageService.getProducts();
    this.products = stored.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category || 'Abarrotes',
      price: p.finalPrice || p.sellingPrice,
      stock: p.stock,
      discountRate: (p.discountPercent || 0) / 100
    }));
  }

  get filteredProducts() {
    return this.products.filter(p => {
      const matchCat = this.activeCategory === 'Todos' || p.category.includes(this.activeCategory);
      const matchSearch = p.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  setCategory(cat: string) {
    this.activeCategory = cat;
  }

  // --- CART LOGIC ---
  addToCart(product: Product) {
    if (product.stock <= 0) return;
    const existing = this.cart.find(c => c.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
      }
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }
  }

  incrementQty(item: CartItem) {
    if (item.quantity < item.stock) {
      item.quantity++;
    }
  }

  decrementQty(item: CartItem) {
    if (item.quantity > 1) {
      item.quantity--;
    } else {
      this.cart = this.cart.filter(c => c.id !== item.id);
    }
  }

  clearCart() {
    this.cart = [];
  }

  get totalItems() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get discountTotal() {
    return this.cart.reduce((sum, item) => {
      if (item.discountRate) {
        return sum + (item.price * item.quantity * item.discountRate);
      }
      return sum;
    }, 0);
  }

  get ivaTotal() {
    return (this.subtotal - this.discountTotal) * 0.16;
  }

  get finalTotal() {
    return (this.subtotal - this.discountTotal) + this.ivaTotal;
  }

  // --- PAYMENT MODAL LOGIC ---
  openPaymentModal() {
    if (this.cart.length === 0) return;
    this.receivedAmount = Number(this.finalTotal.toFixed(2));
    this.isPaymentModalVisible = true;
    this.transactionId = '#F-2024-' + Math.floor(1000 + Math.random() * 9000);
  }

  closePaymentModal() {
    this.isPaymentModalVisible = false;
  }

  get changeReturned() {
    if (this.receivedAmount && this.receivedAmount >= this.finalTotal) {
      return this.receivedAmount - this.finalTotal;
    }
    return 0;
  }

  get isPaymentValid() {
    return this.receivedAmount !== null && this.receivedAmount >= this.finalTotal;
  }

  confirmSale() {
    if (!this.isPaymentValid) return;

    const now = new Date();
    this.transactionDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Deduct stock in memory and storage
    const allStoredProducts = this.storageService.getProducts();
    
    this.cart.forEach(cItem => {
      // Memory
      const p = this.products.find(prod => prod.id === cItem.id);
      if (p) p.stock -= cItem.quantity;

      // Storage
      const storedP = allStoredProducts.find((sp: any) => sp.id === cItem.id);
      if (storedP) storedP.stock -= cItem.quantity;
    });

    // Save updated products
    this.storageService.saveProducts(allStoredProducts);

    // Save to History
    this.storageService.addHistoryEntry({
      id: this.transactionId.replace('#', ''),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      items: this.totalItems,
      method: this.paymentMethod === 'TRANSFERENCIA' ? 'TRANSFER' : this.paymentMethod,
      total: Number(this.finalTotal.toFixed(2)),
      status: 'COMPLETADO'
    });

    this.isPaymentModalVisible = false;
    this.isSaleCompleted = true;
  }

  ngAfterViewChecked(): void {
    if (this.isSaleCompleted && this.barcodeElement) {
      this.generateBarcode();
    }
  }

  generateBarcode() {
    const id = this.transactionId.replace('#', '');
    JsBarcode(this.barcodeElement.nativeElement, id, {
      format: "CODE128",
      lineColor: "#10165F",
      width: 2,
      height: 40,
      displayValue: false
    });
  }

  newSale() {
    this.cart = [];
    this.receivedAmount = null;
    this.isSaleCompleted = false;
  }
}
