import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/admin/inventory-admin.component').then(m => m.InventoryAdminComponent)
      },
      {
        path: 'suppliers',
        loadComponent: () =>
          import('./features/admin/suppliers/suppliers-manage.component').then(m => m.SuppliersManageComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users-manage.component').then(m => m.UsersManageComponent)
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history.component').then(m => m.HistoryComponent)
      }
    ]
  },
  {
    path: 'bodeguero',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/bodeguero/bodeguero-dashboard.component').then(m => m.BodegueroDashboardComponent)
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/bodeguero/inventory-bodeguero.component').then(m => m.InventoryBodegueroComponent)
      }
    ]
  }
];
