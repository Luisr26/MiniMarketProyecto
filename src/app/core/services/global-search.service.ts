import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { map, Observable, combineLatest, debounceTime } from 'rxjs';

export interface SearchResult {
  id: string | number;
  title: string;
  source: 'Inventario' | 'Proveedores' | 'Usuarios' | 'Historial';
  route: string;
  subtitle?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalSearchService {

  constructor(private storageService: StorageService) {}

  /**
   * Performs global search across all modules with debouncing
   * @param query Search query string
   * @returns Observable of SearchResults
   */
  search(query: string): Observable<SearchResult[]> {
    const q = query.toLowerCase().trim();
    
    if (!q) return new Observable(obs => obs.next([]));

    return combineLatest([
      this.storageService.products$,
      this.storageService.suppliers$,
      this.storageService.users$,
      this.storageService.history$
    ]).pipe(
      debounceTime(200), // Optimize performance
      map(([products, suppliers, users, history]) => {
        const results: SearchResult[] = [];

        // Search Products (Inventario)
        if (products && Array.isArray(products)) {
          products.forEach(p => {
            const matchName = p.name?.toLowerCase().includes(q);
            const matchSku = p.sku?.toLowerCase().includes(q);
            const matchCategory = p.category?.toLowerCase().includes(q);
            
            if (matchName || matchSku || matchCategory) {
              results.push({
                id: p.id,
                title: p.name || 'Producto sin nombre',
                subtitle: `SKU: ${p.sku} | Stock: ${p.stock} | $${p.finalPrice || p.sellingPrice}`,
                source: 'Inventario',
                route: '/admin/inventory',
                category: p.category
              });
            }
          });
        }

        // Search Suppliers (Proveedores)
        if (suppliers && Array.isArray(suppliers)) {
          suppliers.forEach(s => {
            const matchName = s.name?.toLowerCase().includes(q);
            const matchEmail = s.email?.toLowerCase().includes(q);
            const matchPhone = s.phone?.toLowerCase().includes(q);
            
            if (matchName || matchEmail || matchPhone) {
              results.push({
                id: s.id,
                title: s.name || 'Proveedor sin nombre',
                subtitle: `${s.email} | SKUs: ${s.skus || 0}`,
                source: 'Proveedores',
                route: '/admin/suppliers'
              });
            }
          });
        }

        // Search Users (Usuarios)
        if (users && Array.isArray(users)) {
          users.forEach(u => {
            const matchName = u.name?.toLowerCase().includes(q);
            const matchEmail = u.email?.toLowerCase().includes(q);
            const matchRole = u.role?.toLowerCase().includes(q);
            
            if (matchName || matchEmail || matchRole) {
              results.push({
                id: u.id,
                title: u.name || 'Usuario sin nombre',
                subtitle: `${u.role} | ${u.email}`,
                source: 'Usuarios',
                route: '/admin/users'
              });
            }
          });
        }

        // Search History / Invoices (Historial)
        if (history && Array.isArray(history)) {
          history.forEach(h => {
            const matchInvoiceId = h.id?.toLowerCase().includes(q);
            const matchMethod = h.method?.toLowerCase().includes(q);
            
            if (matchInvoiceId || matchMethod) {
              results.push({
                id: h.id,
                title: `Factura #${h.id}`,
                subtitle: `Monto: $${h.total} | ${h.method} | ${h.time}`,
                source: 'Historial',
                route: '/admin/history'
              });
            }
          });
        }

        // Sort results by relevance (exact matches first, then partial)
        const sorted = this.sortByRelevance(results, q);
        
        // Return top 10 results
        return sorted.slice(0, 10);
      })
    );
  }

  /**
   * Sort search results by relevance
   */
  private sortByRelevance(results: SearchResult[], query: string): SearchResult[] {
    return results.sort((a, b) => {
      const aTitle = a.title.toLowerCase();
      const bTitle = b.title.toLowerCase();
      
      // Exact match in title gets priority
      if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
      if (!aTitle.startsWith(query) && bTitle.startsWith(query)) return 1;
      
      // Same source priority (group by source)
      if (a.source !== b.source) {
        const sourceOrder = { 'Inventario': 1, 'Proveedores': 2, 'Usuarios': 3, 'Historial': 4 };
        return (sourceOrder[a.source] || 5) - (sourceOrder[b.source] || 5);
      }
      
      return 0;
    });
  }
}
