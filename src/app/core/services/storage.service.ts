import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private PRODUCTS_KEY = 'mm_products';
  private USERS_KEY = 'mm_users';
  private SUPPLIERS_KEY = 'mm_suppliers';
  private HISTORY_KEY = 'mm_history';

  // BehaviorSubjects for Single Source of Truth
  private productsSubject = new BehaviorSubject<any[]>([]);
  private usersSubject = new BehaviorSubject<any[]>([]);
  private suppliersSubject = new BehaviorSubject<any[]>([]);
  private historySubject = new BehaviorSubject<any[]>([]);

  // Public Observables
  products$ = this.productsSubject.asObservable();
  users$ = this.usersSubject.asObservable();
  suppliers$ = this.suppliersSubject.asObservable();
  history$ = this.historySubject.asObservable();

  private apiLoaded = false;

  constructor(private apiService: ApiService) {
    this.initLocalData();
    this.refreshAll();
    // loadFromApi disabled to keep database clean per user request
  }

  /**
   * Attempt to load data from the backend API.
   * Falls back gracefully to localStorage if API is unavailable.
   */
  private loadFromApi() {
    // Load products from API
    this.apiService.getProducts().subscribe(res => {
      if (res.success && res.data) {
        const apiProducts = Array.isArray(res.data) ? res.data : (res.data as any).products || [];
        if (apiProducts.length > 0) {
          // Map API product fields to local format
          const mapped = apiProducts.map((p: any) => ({
            id: p.id,
            name: p.nombre || p.name,
            sku: p.sku || 'ML-' + p.id,
            sellingPrice: p.precio_venta || p.sellingPrice || 0,
            discountPercent: p.descuento || p.discountPercent || 0,
            finalPrice: p.precio_final || (p.precio_venta * (1 - (p.descuento || 0) / 100)) || p.finalPrice || 0,
            stock: p.stock_actual ?? p.stock ?? 0,
            supplier: p.proveedor?.nombre || p.supplier || 'N/A',
            category: p.categoria?.nombre || p.category || 'Abarrotes',
            image: p.imagen || p.image || '',
            // Keep API-specific fields for backend operations
            categoria_id: p.categoria_id,
            proveedor_id: p.proveedor_id,
            stock_minimo: p.stock_minimo
          }));
          localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(mapped));
          this.productsSubject.next(mapped);
          this.apiLoaded = true;
        }
      }
    });

    // Load users from API
    this.apiService.getUsers().subscribe(res => {
      if (res.success && res.data) {
        const apiUsers = Array.isArray(res.data) ? res.data : (res.data as any).users || [];
        if (apiUsers.length > 0) {
          const mapped = apiUsers.map((u: any) => ({
            id: u.id,
            name: u.nombre_completo || u.name,
            email: u.correo || u.email,
            role: u.role || u.rol || 'Cajero',
            status: u.activo !== false ? 'Activo' : 'Inactivo',
            lastLogin: u.ultimo_login || 'N/A',
            role_id: u.role_id
          }));
          localStorage.setItem(this.USERS_KEY, JSON.stringify(mapped));
          this.usersSubject.next(mapped);
        }
      }
    });
  }

  private initLocalData() {
    // PURGE ALL DATA as per user request to leave the database clean
    // We only preserve the session for the QA user
    localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify([]));
    localStorage.setItem(this.USERS_KEY, JSON.stringify([]));
    localStorage.setItem(this.SUPPLIERS_KEY, JSON.stringify([]));
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify([]));

    this.refreshAll();
  }

  private refreshAll() {
    this.productsSubject.next(this.getData(this.PRODUCTS_KEY));
    this.usersSubject.next(this.getData(this.USERS_KEY));
    this.suppliersSubject.next(this.getData(this.SUPPLIERS_KEY));
    this.historySubject.next(this.getData(this.HISTORY_KEY));
  }

  getData(key: string): any[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  saveData(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
    this.refreshAll();
  }

  // Getters for current values (snapshots)
  getProductsValue() { return this.productsSubject.value; }
  getUsersValue() { return this.usersSubject.value; }
  getSuppliersValue() { return this.suppliersSubject.value; }
  getHistoryValue() { return this.historySubject.value; }

  // Fallback for legacy sync code (optional, but good for compatibility)
  getProducts() { return this.getProductsValue(); }
  getHistory() { return this.getHistoryValue(); }
  getUsers() { return this.getUsersValue(); }
  getSuppliers() { return this.getSuppliersValue(); }

  addHistoryEntry(entry: any) {
    const history = this.getHistoryValue();
    const updatedHistory = [entry, ...history];
    this.saveData(this.HISTORY_KEY, updatedHistory);
  }

  saveProducts(products: any[]) { this.saveData(this.PRODUCTS_KEY, products); }
  saveUsers(users: any[]) { this.saveData(this.USERS_KEY, users); }
  saveSuppliers(suppliers: any[]) { this.saveData(this.SUPPLIERS_KEY, suppliers); }

  /**
   * Force reload data from the API
   */
  reloadFromApi() {
    this.loadFromApi();
  }

  get KEYS() {
    return {
      PRODUCTS: this.PRODUCTS_KEY,
      USERS: this.USERS_KEY,
      SUPPLIERS: this.SUPPLIERS_KEY,
      HISTORY: this.HISTORY_KEY
    };
  }
}
