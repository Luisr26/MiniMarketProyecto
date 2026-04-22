import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BASE_URL = 'https://minimarket-backend-he7k.onrender.com/api/v1';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('mm_token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ==================== AUTH ====================
  login(correo: string, contrasena: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE_URL}/auth/login`, { correo, contrasena }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error de conexión' }))
    );
  }

  // ==================== PRODUCTS ====================
  getProducts(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE_URL}/products`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al obtener productos', data: [] }))
    );
  }

  getProductById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE_URL}/products/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al obtener producto' }))
    );
  }

  createProduct(product: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE_URL}/products`, product, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al crear producto' }))
    );
  }

  updateProduct(id: number, product: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.BASE_URL}/products/${id}`, product, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al actualizar producto' }))
    );
  }

  deleteProduct(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.BASE_URL}/products/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al eliminar producto' }))
    );
  }

  // ==================== USERS ====================
  getUsers(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE_URL}/users`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al obtener usuarios', data: [] }))
    );
  }

  createUser(user: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE_URL}/users`, user, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al crear usuario' }))
    );
  }

  deleteUser(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.BASE_URL}/users/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al eliminar usuario' }))
    );
  }

  // ==================== SALES (POS) ====================
  createSale(sale: { turno_id: number; items: { producto_id: number; cantidad: number }[]; metodo_pago: string; descuento_total: number }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE_URL}/sales`, sale, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al registrar venta' }))
    );
  }

  // ==================== INVENTORY ====================
  createInventoryEntry(entry: { proveedor_id: number; items: { producto_id: number; cantidad: number; costo_unitario: number }[] }): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.BASE_URL}/inventory/entry`, entry, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al registrar entrada' }))
    );
  }

  // ==================== DASHBOARD & REPORTS ====================
  getDashboardAdmin(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE_URL}/dashboard/admin`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al obtener dashboard', data: {} }))
    );
  }

  getSalesByDate(startDate: string, endDate: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/sales-by-date?startDate=${startDate}&endDate=${endDate}`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al obtener reporte', data: [] }))
    );
  }

  getTopProducts(limit: number = 5): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.BASE_URL}/reports/top-products?limit=${limit}`, { headers: this.getHeaders() }).pipe(
      catchError(err => of({ success: false, message: err.error?.message || 'Error al obtener top productos', data: [] }))
    );
  }

  seed(): Observable<any> {
    const products = [
      { nombre: 'Agua Mineral 500ml', sku: 'BEB-001', precio_venta: 1200, descuento: 0, precio_final: 1200, stock_actual: 50, stock_minimo: 10, categoria_id: 1, proveedor_id: 1, imagen: '' },
      { nombre: 'Coca Cola 1.5L', sku: 'BEB-002', precio_venta: 4500, descuento: 10, precio_final: 4050, stock_actual: 30, stock_minimo: 5, categoria_id: 1, proveedor_id: 1, imagen: '' },
      { nombre: 'Leche Entera 1L', sku: 'LAC-001', precio_venta: 3800, descuento: 0, precio_final: 3800, stock_actual: 40, stock_minimo: 8, categoria_id: 2, proveedor_id: 2, imagen: '' },
      { nombre: 'Yogurt Griego 150g', sku: 'LAC-002', precio_venta: 2500, descuento: 5, precio_final: 2375, stock_actual: 20, stock_minimo: 5, categoria_id: 2, proveedor_id: 2, imagen: '' },
      { nombre: 'Arroz Blanco 1kg', sku: 'GRA-001', precio_venta: 3200, descuento: 0, precio_final: 3200, stock_actual: 100, stock_minimo: 20, categoria_id: 3, proveedor_id: 3, imagen: '' },
      { nombre: 'Lentejas 500g', sku: 'GRA-002', precio_venta: 2800, descuento: 0, precio_final: 2800, stock_actual: 60, stock_minimo: 15, categoria_id: 3, proveedor_id: 3, imagen: '' },
      { nombre: 'Aceite Girasol 1L', sku: 'ACE-001', precio_venta: 9500, descuento: 15, precio_final: 8075, stock_actual: 25, stock_minimo: 5, categoria_id: 4, proveedor_id: 4, imagen: '' },
      { nombre: 'Sal Refinada 1kg', sku: 'ABA-001', precio_venta: 1500, descuento: 0, precio_final: 1500, stock_actual: 80, stock_minimo: 10, categoria_id: 5, proveedor_id: 1, imagen: '' },
      { nombre: 'Azúcar Blanca 1kg', sku: 'ABA-002', precio_venta: 2800, descuento: 0, precio_final: 2800, stock_actual: 70, stock_minimo: 10, categoria_id: 5, proveedor_id: 1, imagen: '' },
      { nombre: 'Detergente Líquido 2L', sku: 'LIM-001', precio_venta: 18500, descuento: 20, precio_final: 14800, stock_actual: 15, stock_minimo: 3, categoria_id: 6, proveedor_id: 2, imagen: '' },
      { nombre: 'Jabón de Loza 500g', sku: 'LIM-002', precio_venta: 4200, descuento: 0, precio_final: 4200, stock_actual: 45, stock_minimo: 10, categoria_id: 6, proveedor_id: 2, imagen: '' },
      { nombre: 'Papel Higiénico 4 rollos', sku: 'ASE-001', precio_venta: 8500, descuento: 10, precio_final: 7650, stock_actual: 40, stock_minimo: 5, categoria_id: 7, proveedor_id: 3, imagen: '' },
      { nombre: 'Shampoo Anticaspa 400ml', sku: 'ASE-002', precio_venta: 12500, descuento: 0, precio_final: 12500, stock_actual: 12, stock_minimo: 4, categoria_id: 7, proveedor_id: 3, imagen: '' },
      { nombre: 'Café Molido 500g', sku: 'BEB-003', precio_venta: 14000, descuento: 0, precio_final: 14000, stock_actual: 25, stock_minimo: 5, categoria_id: 1, proveedor_id: 4, imagen: '' },
      { nombre: 'Té Negro 20 bolsas', sku: 'BEB-004', precio_venta: 5200, descuento: 5, precio_final: 4940, stock_actual: 18, stock_minimo: 5, categoria_id: 1, proveedor_id: 4, imagen: '' },
      { nombre: 'Pasta Spaghetti 500g', sku: 'GRA-003', precio_venta: 2600, descuento: 0, precio_final: 2600, stock_actual: 55, stock_minimo: 10, categoria_id: 3, proveedor_id: 1, imagen: '' },
      { nombre: 'Atún en Agua 170g', sku: 'ABA-003', precio_venta: 5800, descuento: 10, precio_final: 5220, stock_actual: 35, stock_minimo: 8, categoria_id: 5, proveedor_id: 2, imagen: '' },
      { nombre: 'Galletas Saltinas', sku: 'SNA-001', precio_venta: 1800, descuento: 0, precio_final: 1800, stock_actual: 40, stock_minimo: 10, categoria_id: 8, proveedor_id: 3, imagen: '' },
      { nombre: 'Papas Fritas 150g', sku: 'SNA-002', precio_venta: 4200, descuento: 0, precio_final: 4200, stock_actual: 22, stock_minimo: 5, categoria_id: 8, proveedor_id: 3, imagen: '' },
      { nombre: 'Pan Tajado Blanco', sku: 'PAN-001', precio_venta: 5500, descuento: 5, precio_final: 5225, stock_actual: 15, stock_minimo: 4, categoria_id: 3, proveedor_id: 4, imagen: '' }
    ];

    // Seed users
    const users = [
      { nombre_completo: 'Admin Master', correo: 'admin@medialuna.com', contrasena: 'admin123', role_id: 1 },
      { nombre_completo: 'Elena Bodega', correo: 'bodega@medialuna.com', contrasena: 'bodega123', role_id: 2 },
      { nombre_completo: 'Roberto Cajero', correo: 'cajero@medialuna.com', contrasena: 'cajero123', role_id: 3 },
      { nombre_completo: 'QA Tester Software', correo: 'qa@medialuna.com', contrasena: 'qa123', role_id: 1 } // QA as admin role in DB but special logic in frontend
    ];

    // Note: This is a simplified seed for demo. In real app, we'd use a loop or batch endpoint.
    return of({ products, users });
  }
}
