import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private PRODUCTS_KEY = 'mm_products';
  private USERS_KEY = 'mm_users';
  private SUPPLIERS_KEY = 'mm_suppliers';
  private HISTORY_KEY = 'mm_history';

  constructor() {
    this.initData();
  }

  private initData() {
    // Initial products
    if (!localStorage.getItem(this.PRODUCTS_KEY)) {
      const initialProducts = [
        { id: 1, name: 'Leche Entera 1L', sku: 'ML-00124', sellingPrice: 1250.0, discountPercent: 5, finalPrice: 1187.5, stock: 48, supplier: 'Lácteos del Valle', category: 'Lácteos' },
        { id: 2, name: 'Arroz Premium 1kg', sku: 'ML-00582', sellingPrice: 2100.0, discountPercent: 0, finalPrice: 2100.0, stock: 8, supplier: 'Distribuidora Central', category: 'Granos' },
        { id: 3, name: 'Aceite de Oliva 500ml', sku: 'ML-00843', sellingPrice: 5800.0, discountPercent: 15, finalPrice: 4930.0, stock: 25, supplier: 'Importaciones Mediterráneas', category: 'Aceites' },
        { id: 4, name: 'Pasta Spaghetti 500g', sku: 'ML-00912', sellingPrice: 1500.0, discountPercent: 0, finalPrice: 1500.0, stock: 40, supplier: 'Distribuidora Central', category: 'Granos' }
      ];
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(initialProducts));
    }

    // Initial users
    if (!localStorage.getItem(this.USERS_KEY)) {
      const initialUsers = [
        { id: 1, name: 'Ricardo Mendoza', email: 'admin@medialuna.com', role: 'Admin', status: 'Activo', lastLogin: 'Hoy, 08:45 AM' },
        { id: 2, name: 'Elena Garcés', email: 'bodega@medialuna.com', role: 'Bodeguero', status: 'Activo', lastLogin: 'Ayer, 06:12 PM' },
        { id: 3, name: 'Roberto Méndez', email: 'cajero@medialuna.com', role: 'Cajero', status: 'Activo', lastLogin: 'Hace 3 días' }
      ];
      localStorage.setItem(this.USERS_KEY, JSON.stringify(initialUsers));
    }

    // Initial suppliers
    if (!localStorage.getItem(this.SUPPLIERS_KEY)) {
      const initialSuppliers = [
        { id: 1, name: 'Distribuidora Los Andes', email: 'ventas@losandes.com', phone: '+56 9 8765 4321', skus: 124, registrationDate: '12 Oct, 2023', initials: 'DL', color: '#E0E7FF' },
        { id: 2, name: 'Soluciones Frescas S.A.', email: 'contacto@solucionesfrescas.cl', phone: '+56 2 2445 1100', skus: 45, registrationDate: '05 Nov, 2023', initials: 'SF', color: '#DCFCE7' }
      ];
      localStorage.setItem(this.SUPPLIERS_KEY, JSON.stringify(initialSuppliers));
    }

    // Initial history
    if (!localStorage.getItem(this.HISTORY_KEY)) {
      const initialHistory = [
        { id: 'F-2024-0891', time: '14:45 PM', items: 12, method: 'EFECTIVO', total: 145.20, status: 'COMPLETADO' },
        { id: 'F-2024-0890', time: '14:32 PM', items: 3, method: 'TARJETA', total: 42.00, status: 'COMPLETADO' },
        { id: 'F-2024-0889', time: '14:10 PM', items: 24, method: 'EFECTIVO', total: 312.50, status: 'COMPLETADO' },
        { id: 'F-2024-0888', time: '13:55 PM', items: 1, method: 'TARJETA', total: 5.75, status: 'COMPLETADO' }
      ];
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(initialHistory));
    }
  }

  // Generic methods
  getData(key: string): any[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  saveData(key: string, data: any[]) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Accessors
  getProducts() { return this.getData(this.PRODUCTS_KEY); }
  getUsers() { return this.getData(this.USERS_KEY); }
  getSuppliers() { return this.getData(this.SUPPLIERS_KEY); }
  getHistory() { return this.getData(this.HISTORY_KEY); }

  addHistoryEntry(entry: any) {
    const history = this.getHistory();
    history.unshift(entry);
    this.saveData(this.HISTORY_KEY, history);
  }

  saveProducts(products: any[]) { this.saveData(this.PRODUCTS_KEY, products); }
  saveUsers(users: any[]) { this.saveData(this.USERS_KEY, users); }
  saveSuppliers(suppliers: any[]) { this.saveData(this.SUPPLIERS_KEY, suppliers); }

  get KEYS() {
    return {
      PRODUCTS: this.PRODUCTS_KEY,
      USERS: this.USERS_KEY,
      SUPPLIERS: this.SUPPLIERS_KEY,
      HISTORY: this.HISTORY_KEY
    };
  }
}
